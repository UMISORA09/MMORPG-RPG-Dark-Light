import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  useGetMe,
  getGetMeQueryKey,
  useGetCharacters,
  getGetCharactersQueryKey,
  useGetCharacter,
  getGetCharacterQueryKey,
  useGetMonsters,
  getGetMonstersQueryKey,
  useStartBattle,
  getGetBattleLogQueryKey,
  getGetLeaderboardQueryKey,
  useLogout,
  type Character,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Game from "@/game/Game";
import { useGameStore } from "@/game/useGameStore";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { UnifiedOverlayModals } from "@/components/UnifiedOverlayModals";
import { useCharacterAutoSave, triggerGlobalAutoSave } from "@/hooks/useCharacterAutoSave";
import { AutoSaveIndicator } from "@/components/AutoSaveIndicator";
import { playCombatSFX } from "@/audio/CombatSoundSynth";
import { PersistenceManager, usePersistenceStore } from "@/persistence/PersistenceManager";
import {
  claimActiveTabSession,
  setupSessionGuardListeners,
} from "@/lib/sessionGuard";
import { SessionDisplacedModal } from "@/components/SessionDisplacedModal";

export default function GamePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Authentication & Character Data ──
  const { data: user, isLoading: userLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey() },
  });

  const { data: characters, isLoading: charactersLoading } = useGetCharacters({
    query: { queryKey: getGetCharactersQueryKey() },
  });

  const charList = Array.isArray(characters) ? characters : [];
  const selectedCharId = typeof window !== "undefined" ? Number(localStorage.getItem("selectedCharacterId")) : null;
  const preferredCharId = selectedCharId || (user as any)?.lastCharacterId || null;
  const character = (charList.length > 0 && preferredCharId ? charList.find((c) => c.id === preferredCharId) : null) || charList[0];

  const localSelectedChar = typeof window !== "undefined" ? (() => {
    try {
      const s = localStorage.getItem("clb_selected_character");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })() : null;

  const targetCharId = character?.id || localSelectedChar?.id || selectedCharId || 0;

  useEffect(() => {
    if (targetCharId && typeof window !== "undefined") {
      localStorage.setItem("selectedCharacterId", String(targetCharId));
      useGameWorldStore.getState().setActiveCharacterId(targetCharId);
    }
  }, [targetCharId]);

  const { data: characterDetail, isLoading: characterLoading } = useGetCharacter(
    targetCharId,
    {
      query: {
        queryKey: getGetCharacterQueryKey(targetCharId),
        enabled: !!targetCharId,
      },
    }
  );

  // Keep monster definitions cached for reference
  useGetMonsters({
    query: { queryKey: getGetMonstersQueryKey() },
  });

  const startBattle = useStartBattle();
  const logout = useLogout();

  // Navigation Guard: Redirect if not logged in or no character anywhere
  useEffect(() => {
    if (!userLoading && !user) {
      setLocation("/login");
    } else if (!charactersLoading && (!characters || characters.length === 0) && !localSelectedChar) {
      setLocation("/characters");
    }
  }, [user, userLoading, characters, charactersLoading, localSelectedChar, setLocation]);

  // Synchronize backend/cached character stats to Zustand Game Store on first load or change
  const activeCharacter = characterDetail || character || localSelectedChar;

  useEffect(() => {
    if (!activeCharacter?.id) return;

    // ── 🛡️ Single-Session Enforcement & Instant Duplicate Guard ──
    claimActiveTabSession(activeCharacter.id, user?.id);
    const cleanupSessionGuard = setupSessionGuardListeners(activeCharacter.id, user?.id);

    useGameStore.getState().syncFromCharacter(activeCharacter);
    useGameWorldStore.getState().syncFromBackendCharacter(activeCharacter);

    // ── HẠNG MỤC 4: Full-State Hydration & Reconciliation với Local WAL ──
    const wal = PersistenceManager.getLocalWal(activeCharacter.id);
    const walIsFresh = wal && Date.now() - wal.timestamp < 24 * 60 * 60 * 1000;

    fetch(`/api/characters/${activeCharacter.id}/full-state`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.character) return;
        const srv = data.character;

        // Nếu Local WAL mới hơn Server (do mất mạng hoặc tắt máy đột ngột), khôi phục từ WAL và đồng bộ lên server
        if (walIsFresh && wal && (wal.revision > (srv.revision || 1) || wal.timestamp > new Date(srv.lastSavedAt || 0).getTime())) {
          console.log(`[Hydration] Local WAL mới hơn Server! Phục hồi từ WAL (Rev #${wal.revision})...`);
          useGameWorldStore.getState().syncFromBackendCharacter({
            ...srv,
            posX: wal.posX,
            posZ: wal.posZ,
            facing: wal.facing,
            level: wal.level,
            experience: wal.experience,
            gold: wal.gold,
            hp: wal.hp,
            mp: wal.mp,
            unallocatedStatPoints: wal.statPoints,
            unlockedSlots: wal.unlockedSlots,
            isMounted: wal.isMounted,
            inventory: data.inventory,
          });
          PersistenceManager.flushImmediate(activeCharacter.id, "Khôi phục sau tắt tab đột ngột").catch(() => {});
        } else {
          // Server là nguồn chuẩn xác nhất
          useGameWorldStore.getState().syncFromBackendCharacter({
            ...srv,
            inventory: data.inventory,
          });
          usePersistenceStore.getState().setStatus("synced", srv.revision || 1, "Tải từ máy chủ");
        }
      })
      .catch((err) => {
        console.warn("[Hydration] Fetch full-state notice:", err);
      });

    return () => {
      cleanupSessionGuard();
    };
  }, [activeCharacter?.id, user?.id]);

  // Store latest character detail in a ref to avoid stale closure in callbacks
  const charRef = useRef<Character | null>(null);
  if (activeCharacter) {
    charRef.current = activeCharacter;
  }

  // Track if game canvas has been mounted once to NEVER unmount 3D WebGL context on background refetch
  const hasInitializedRef = useRef(false);
  if (activeCharacter) {
    hasInitializedRef.current = true;
  }

  // ── Real-Time Combat Sync with Backend PostgreSQL via useStartBattle ──
  useEffect(() => {
    const handleMonsterDefeat = (monsterId: string) => {
      const currentChar = charRef.current;
      if (!currentChar) return;

      // Auto-call backend battle mutation to persist victory, rewards, logs and level-ups
      startBattle.mutate(
        { characterId: currentChar.id, data: { monsterId } },
        {
          onSuccess: async (result) => {
            // Update React Query cache directly for instantaneous, seamless updates without re-triggering loading states
            queryClient.setQueryData(getGetCharacterQueryKey(currentChar.id), result.character);

            // Ensure safe HP so player is never locked at 0 HP
            const safeHp = Math.max(1, result.character.hp);

            // Update both stores HUD with new gold, exp, level and health
            useGameWorldStore.getState().updateAfterBattle({
              exp: result.character.experience,
              gold: result.character.gold,
              level: result.character.level,
              hp: safeHp,
              maxHp: result.character.maxHp,
              unallocatedStatPoints: (result.character as any).unallocatedStatPoints,
            });
            useGameStore.getState().updatePlayerStatsAfterBattle({
              exp: result.character.experience,
              gold: result.character.gold,
              level: result.character.level,
              hp: safeHp,
              maxHp: result.character.maxHp,
              unallocatedStatPoints: (result.character as any).unallocatedStatPoints,
            });

            // Show celebratory notification for Level Up
            if (result.leveledUp) {
              playCombatSFX("level_up_fanfare", 0.85);
              toast({
                title: "🎉 THĂNG CẤP THÀNH CÔNG!",
                description: `Chúc mừng bạn đã đạt Cấp ${result.character.level}! Sức mạnh tấn công và phòng ngự tăng vọt.`,
              });
              triggerGlobalAutoSave("level_up");
            } else {
              triggerGlobalAutoSave("loot_drop");
            }

            // Invalidate logs & leaderboard without triggering character re-fetch
            queryClient.invalidateQueries({
              queryKey: getGetBattleLogQueryKey(currentChar.id),
            });
            queryClient.invalidateQueries({
              queryKey: getGetLeaderboardQueryKey(),
            });
          },
          onError: (err: any) => {
            console.error("Lỗi đồng bộ chiến đấu về cơ sở dữ liệu:", err);
          },
        }
      );
    };

    const handlePlayerDefeat = () => {
      // Player defeated: Show notification
      toast({
        variant: "destructive",
        title: "💀 Bạn đã bị hạ gục!",
        description: "Được hộ tống về Làng Long Tộc để trị thương và hồi sinh đầy bình máu.",
      });
    };

    useGameStore.getState().registerCombatCallbacks(handleMonsterDefeat, handlePlayerDefeat);
    useGameWorldStore.getState().registerCombatCallbacks(handleMonsterDefeat, handlePlayerDefeat);
  }, [startBattle, queryClient, toast]);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: async () => {
        try {
          localStorage.removeItem("clb_token");
        } catch {}
        await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/");
      },
    });
  };

  const { showIndicator, lastSavedTime } = useCharacterAutoSave(activeCharacter?.id);

  // Loading state: Only show full-screen spinner on first initialization. NEVER unmount once mounted!
  if (!hasInitializedRef.current && (userLoading || (!activeCharacter && (charactersLoading || characterLoading)))) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-white select-none">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
          <h2 className="text-xl font-black tracking-wider text-amber-300">CHIẾN LONG BÁ</h2>
          <p className="text-xs font-mono text-slate-400">Đang khởi tạo Thế Giới Mở Liên Thông 3D...</p>
        </div>
      </div>
    );
  }

    if (!activeCharacter) {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-white relative overflow-hidden"
        style={{
          backgroundColor: "#4c6e6f",
          backgroundImage: "radial-gradient(circle at 50% 50%, #567c7d 0%, #446364 75%, #385253 100%)",
        }}
      >
        <div className="relative w-full max-w-md p-8 rounded-[28px] bg-[#342a2b] border border-[#5d4648] shadow-2xl flex flex-col items-center text-center gap-5 my-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#4a383a] border border-[#5d4648] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#28c3e1] border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <h3 className="font-sans text-xl font-bold text-white mb-1.5">ĐANG KẾT NỐI ANH HÙNG</h3>
            <p className="font-sans text-xs text-[#8e7a7c]">
              Đang xác thực thông tin nhân vật và chuẩn bị bước vào Đại Lục...
            </p>
          </div>
          <button
            onClick={() => setLocation("/characters")}
            className="w-full py-3 rounded-full bg-[#28c3e1] hover:brightness-110 text-[#1c161a] font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(40,195,225,0.4)] transition-all cursor-pointer"
          >
            Đến Sảnh Chọn Nhân Vật
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="fixed inset-0 w-full h-full overflow-hidden bg-black select-none">
      {/* ── 1 Single Unified 3D Real-Time World Canvas & HUD ── */}
      <Game onLogout={handleLogout} />

      {/* ── Glassmorphism Overlay Modals (Inventory, Shop, Leaderboard, Battle Logs) ── */}
      <UnifiedOverlayModals character={activeCharacter} />

      {/* ── Real-Time Character & Server Auto-Save Status Indicator ── */}
      <AutoSaveIndicator show={showIndicator} time={lastSavedTime} />

      {/* ── Single-Session Displaced & Duplicate Modal ── */}
      <SessionDisplacedModal />
    </main>
  );
}
