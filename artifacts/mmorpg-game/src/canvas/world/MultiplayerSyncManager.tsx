import { memo, useEffect, useRef } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { RemotePlayerEntity25D } from "../entities/RemotePlayerEntity25D";

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

  useEffect(() => {
    let isCancelled = false;

    const interval = setInterval(async () => {
      if (typeof window === "undefined") return;

      const now = Date.now();
      if (now - lastSyncTime.current < 600) return;
      lastSyncTime.current = now;

      const targetId = activeCharacterId || Number(localStorage.getItem("selectedCharacterId")) || 0;
      if (!targetId || targetId <= 0) return;

      const store = useGameWorldStore.getState();
      const token = typeof window !== "undefined" ? (localStorage.getItem("clb_token") || localStorage.getItem("token")) : null;

      try {
        const res = await fetch("/api/multiplayer/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            characterId: targetId,
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
          }),
        });

        if (res.ok && !isCancelled) {
          const data = await res.json();
          if (Array.isArray(data.players)) {
            setRemotePlayers(data.players);
          }
        }
      } catch {
        // Ignore transient network errors during sync
      }
    }, 800);

    return () => {
      isCancelled = true;
      clearInterval(interval);
      const targetId = activeCharacterId || (typeof window !== "undefined" ? Number(localStorage.getItem("selectedCharacterId")) : 0);
      const token = typeof window !== "undefined" ? (localStorage.getItem("clb_token") || localStorage.getItem("token")) : null;
      if (targetId && targetId > 0) {
        fetch("/api/multiplayer/disconnect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ characterId: targetId }),
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

