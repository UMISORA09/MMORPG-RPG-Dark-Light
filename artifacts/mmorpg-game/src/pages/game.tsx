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

  const selectedCharId = typeof window !== "undefined" ? Number(localStorage.getItem("selectedCharacterId")) : null;
  const character = (characters && selectedCharId ? characters.find((c) => c.id === selectedCharId) : null) || characters?.[0];

  const { data: characterDetail, isLoading: characterLoading } = useGetCharacter(
    character?.id || 0,
    {
      query: {
        queryKey: getGetCharacterQueryKey(character?.id || 0),
        enabled: !!character?.id,
      },
    }
  );

  // Keep monster definitions cached for reference
  useGetMonsters({
    query: { queryKey: getGetMonstersQueryKey() },
  });

  const startBattle = useStartBattle();
  const logout = useLogout();

  // Navigation Guard: Redirect if not logged in or no character
  useEffect(() => {
    if (!userLoading && !user) {
      setLocation("/");
    } else if (!charactersLoading && (!characters || characters.length === 0)) {
      setLocation("/characters");
    }
  }, [user, userLoading, characters, charactersLoading, setLocation]);

  // Synchronize backend character stats to Zustand Game Store on first load or change
  useEffect(() => {
    if (characterDetail) {
      useGameStore.getState().syncFromCharacter(characterDetail);
      useGameWorldStore.getState().syncFromBackendCharacter(characterDetail);
    }
  }, [characterDetail]);

  // Store latest character detail in a ref to avoid stale closure in callbacks
  const charRef = useRef<Character | null>(null);
  charRef.current = characterDetail || null;

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
            // Update both stores HUD with new gold, exp, level and health
            useGameWorldStore.getState().updateAfterBattle({
              exp: result.character.experience,
              gold: result.character.gold,
              level: result.character.level,
              hp: result.character.hp,
              maxHp: result.character.maxHp,
            });
            useGameStore.getState().updatePlayerStatsAfterBattle({
              exp: result.character.experience,
              gold: result.character.gold,
              level: result.character.level,
              hp: result.character.hp,
              maxHp: result.character.maxHp,
            });

            // Show celebratory notification for Level Up
            if (result.leveledUp) {
              toast({
                title: "🎉 THĂNG CẤP THÀNH CÔNG!",
                description: `Chúc mừng bạn đã đạt Cấp ${result.character.level}! Sức mạnh tấn công và phòng ngự tăng vọt.`,
              });
            }

            // Invalidate cache to ensure UI and modals stay in sync
            await Promise.all([
              queryClient.invalidateQueries({
                queryKey: getGetCharacterQueryKey(currentChar.id),
              }),
              queryClient.invalidateQueries({
                queryKey: getGetCharactersQueryKey(),
              }),
              queryClient.invalidateQueries({
                queryKey: getGetBattleLogQueryKey(currentChar.id),
              }),
              queryClient.invalidateQueries({
                queryKey: getGetLeaderboardQueryKey(),
              }),
            ]);
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
        await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/");
      },
    });
  };

  // Loading state
  if (userLoading || charactersLoading || characterLoading || !characterDetail) {
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

  return (
    <main className="fixed inset-0 w-full h-full overflow-hidden bg-black select-none">
      {/* ── 1 Single Unified 3D Real-Time World Canvas & HUD ── */}
      <Game onLogout={handleLogout} />

      {/* ── Glassmorphism Overlay Modals (Inventory, Shop, Leaderboard, Battle Logs) ── */}
      <UnifiedOverlayModals character={characterDetail} />
    </main>
  );
}
