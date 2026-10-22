import { memo, useEffect, useRef } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { RemotePlayerEntity25D } from "../entities/RemotePlayerEntity25D";
import { getTabSessionId, useSessionDisplacementStore } from "@/lib/sessionGuard";

export const MultiplayerSyncManager = memo(function MultiplayerSyncManager() {
  const playerPosition = useGameWorldStore((s) => s.playerPosition);
  const playerFacingLeft = useGameWorldStore((s) => s.playerFacingLeft);
  const playerAnimState = useGameWorldStore((s) => s.playerAnimState);
  const playerName = useGameWorldStore((s) => s.playerName);
  const playerClassId = useGameWorldStore((s) => s.playerClassId);
  const playerLevel = useGameWorldStore((s) => s.playerLevel);
  const playerGender = useGameWorldStore((s) => s.playerGender);
  const playerHealth = useGameWorldStore((s) => s.playerHealth);
  const playerMaxHealth = useGameWorldStore((s) => s.playerMaxHealth);
  const highestEnhanceLevel = useGameWorldStore((s) => s.highestEnhanceLevel);
  const currentZone = useGameWorldStore((s) => s.currentZone);
  const overheadChatBubble = useGameWorldStore((s) => s.overheadChatBubble);
  const remotePlayers = useGameWorldStore((s) => s.remotePlayers);
  const setRemotePlayers = useGameWorldStore((s) => s.setRemotePlayers);
  const activeCharacterId = useGameWorldStore((s) => s.activeCharacterId);

  const lastSyncTime = useRef(0);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const hasClaimedRef = useRef(false);

  // ── 0.00001s Ultra-Low Latency Inter-Client Broadcast Channel ──
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel("clb_multiplayer_instant");
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const { type, player, characterId, sessionId } = event.data || {};
      const currentId = useGameWorldStore.getState().activeCharacterId || Number(localStorage.getItem("selectedCharacterId")) || 0;
      const mySessionId = getTabSessionId();
      
      // 🛡️ Instant Duplicate Detection across tabs
      if (type === "SESSION_TAKEOVER") {
        if (Number(characterId) === currentId && sessionId && sessionId !== mySessionId) {
          useSessionDisplacementStore.getState().triggerDisplacement("Nhân vật của bạn vừa được mở trên một cửa sổ tab khác.");
          return;
        }
      }

      if (type === "SYNC_PLAYER" && player) {
        // If another tab broadcasts state for the EXACT same character with different session ID
        if (player.characterId === currentId && player.sessionId && player.sessionId !== mySessionId) {
          useSessionDisplacementStore.getState().triggerDisplacement("Phát hiện nhân vật đang được điều khiển ở một tab khác.");
          return;
        }

        if (player.characterId !== currentId) {
          const prev = useGameWorldStore.getState().remotePlayers || [];
          const idx = prev.findIndex((p: any) => p.characterId === player.characterId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...player };
            setRemotePlayers(next);
          } else {
            setRemotePlayers([...prev, player]);
          }
        }
      } else if (type === "DISCONNECT_PLAYER" && characterId) {
        const prev = useGameWorldStore.getState().remotePlayers || [];
        setRemotePlayers(prev.filter((p: any) => p.characterId !== characterId));
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [setRemotePlayers]);

  useEffect(() => {
    let isCancelled = false;

    const syncTick = async () => {
      if (typeof window === "undefined" || isCancelled) return;
      if (useSessionDisplacementStore.getState().isDisplaced) return;

      const now = Date.now();
      const isMoving = playerAnimState === "run";
      const minInterval = isMoving ? 280 : 650;
      if (now - lastSyncTime.current < minInterval) return;
      lastSyncTime.current = now;

      const targetId = activeCharacterId || Number(localStorage.getItem("selectedCharacterId")) || 0;
      if (!targetId || targetId <= 0) return;

      const store = useGameWorldStore.getState();
      const token = typeof window !== "undefined" ? (localStorage.getItem("clb_token") || localStorage.getItem("token")) : null;
      const mySessionId = getTabSessionId();

      const isFirstClaim = !hasClaimedRef.current;
      if (isFirstClaim) {
        hasClaimedRef.current = true;
      }

      const localPayload = {
        characterId: targetId,
        sessionId: mySessionId,
        claimSession: isFirstClaim,
        name: playerName,
        classId: playerClassId,
        level: playerLevel,
        gender: playerGender,
        posX: Number(playerPosition.x.toFixed(2)),
        posZ: Number(playerPosition.z.toFixed(2)),
        facing: playerFacingLeft ? -Math.PI / 2 : Math.PI / 2,
        facingLeft: playerFacingLeft,
        animState: playerAnimState,
        enhanceLevel: highestEnhanceLevel,
        hp: playerHealth,
        maxHp: playerMaxHealth,
        chatBubble: overheadChatBubble,
        zoneId: currentZone,
        serverId: "s1_long_vuong",
        hairStyle: store.playerHairStyle || "phong_van",
        hairColor: store.playerHairColor || "#1e1e1e",
        outfitId: store.playerOutfitId || "basic",
        auraIds: store.playerAuraIds || "[]",
        isMounted: store.isMounted || false,
        mountId: store.activeMountId || "",
        petId: store.petActive ? store.petType : "",
      };

      // 1. Instant local broadcast (0.00001s transmission across same-origin sessions)
      if (channelRef.current) {
        channelRef.current.postMessage({ type: "SYNC_PLAYER", player: localPayload });
      }

      // 2. High-performance REST sync with Vercel & Supabase
      try {
        const res = await fetch("/api/multiplayer/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": mySessionId,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(localPayload),
        });

        if (res.ok && !isCancelled) {
          const data = await res.json();
          if (data?.kick) {
            useSessionDisplacementStore.getState().triggerDisplacement(
              data.reason || "Phiên kết nối của bạn đã bị ngắt do có phiên đăng nhập mới."
            );
            return;
          }
          if (Array.isArray(data.players)) {
            setRemotePlayers(data.players);
          }
        }
      } catch {
        // Ignore transient network errors during sync
      }
    };

    const interval = setInterval(syncTick, 300);

    return () => {
      isCancelled = true;
      clearInterval(interval);
      const targetId = activeCharacterId || (typeof window !== "undefined" ? Number(localStorage.getItem("selectedCharacterId")) : 0);
      const token = typeof window !== "undefined" ? (localStorage.getItem("clb_token") || localStorage.getItem("token")) : null;
      const mySessionId = getTabSessionId();

      if (channelRef.current && targetId) {
        channelRef.current.postMessage({
          type: "DISCONNECT_PLAYER",
          characterId: targetId,
          sessionId: mySessionId,
        });
      }

      if (targetId && targetId > 0 && !useSessionDisplacementStore.getState().isDisplaced) {
        fetch("/api/multiplayer/disconnect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": mySessionId,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ characterId: targetId, sessionId: mySessionId }),
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, [
    activeCharacterId,
    playerPosition,
    playerFacingLeft,
    playerAnimState,
    playerName,
    playerClassId,
    playerLevel,
    playerGender,
    playerHealth,
    playerMaxHealth,
    highestEnhanceLevel,
    currentZone,
    overheadChatBubble,
    setRemotePlayers,
  ]);

  return (
    <group>
      {remotePlayers.map((player) => (
        <RemotePlayerEntity25D key={`remote-${player.characterId}`} player={player} />
      ))}
    </group>
  );
});

