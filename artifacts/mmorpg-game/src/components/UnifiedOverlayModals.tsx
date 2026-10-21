import { memo, useState } from "react";
import { InventoryEquipmentPanel } from "./InventoryEquipmentPanel";
import { CharacterInventoryModal } from "@/ui/modals/CharacterInventoryModal";
import { GameSettingsPanel } from "./GameSettingsPanel";
import { QuestLogModal } from "@/ui/modals/QuestLogModal";
import { BlacksmithModal } from "@/ui/modals/BlacksmithModal";
import { AuctionHouseModal } from "@/ui/modals/AuctionHouseModal";
import { TalentAndAwakeningModal } from "@/ui/modals/TalentAndAwakeningModal";
import { CodexModal } from "@/ui/modals/CodexModal";
import { CharacterAttributesPanel } from "@/ui/modals/CharacterAttributesPanel";
import { PvPArenaModal } from "@/ui/modals/PvPArenaModal";
import { GMAdminPanel } from "@/ui/modals/GMAdminPanel";
import { DungeonSelectModal } from "@/ui/modals/DungeonSelectModal";
import { BattleReportModal } from "@/ui/modals/BattleReportModal";
import { AchievementsModal } from "@/ui/modals/AchievementsModal";
import { DailyLoginModal } from "@/ui/modals/DailyLoginModal";
import { WorldAtlasModal } from "@/ui/modals/WorldAtlasModal";
import { PartyModal } from "@/ui/modals/PartyModal";
import { LoadingTransitionScreen } from "@/ui/transition/LoadingTransitionScreen";
import { PlayerDeathRespawnModal } from "./PlayerDeathRespawnModal";
import {
  useGetInventory,
  getGetInventoryQueryKey,
  useGetItems,
  getGetItemsQueryKey,
  useBuyItem,
  useEquipItem,
  useUnequipItem,
  useGetLeaderboard,
  getGetLeaderboardQueryKey,
  getGetCharacterQueryKey,
  getGetCharactersQueryKey,
  type Character,
  type InventoryItem,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useGameStore } from "../stores";
import { useToast } from "@/hooks/use-toast";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { playButtonClick } from "@/audio/CombatSoundSynth";
import { 
  X, 
  Backpack, 
  ShoppingBag, 
  Trophy, 
  Settings,
  Maximize2,
  Minimize2,
} from "lucide-react";

export interface UnifiedOverlayModalsProps {
  character: Character;
}

export const UnifiedOverlayModals = memo(function UnifiedOverlayModals({
  character,
}: UnifiedOverlayModalsProps) {
  const [isSidePanel, setIsSidePanel] = useState(false);
  const worldModal = useGameWorldStore((s) => s.activeModal);
  const legacyModal = useGameStore((s) => s.game.activeModal);
  const activeModal = worldModal || legacyModal;

  const closeActiveModal = () => {
    useGameWorldStore.getState().closeActiveModal();
    useGameStore.getState().closeActiveModal();
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Queries ──
  const { data: inventory = [], isLoading: inventoryLoading } = useGetInventory(
    character.id,
    { query: { queryKey: getGetInventoryQueryKey(character.id), enabled: activeModal === "inventory" || activeModal === "shop" } }
  );

  const { data: shopItems = [], isLoading: shopLoading } = useGetItems({
    query: { queryKey: getGetItemsQueryKey(), enabled: activeModal === "shop" || activeModal === "inventory" },
  });

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useGetLeaderboard({
    query: { queryKey: getGetLeaderboardQueryKey(), enabled: activeModal === "leaderboard" },
  });

  // ── Mutations ──
  const buyItem = useBuyItem();
  const equipItem = useEquipItem();
  const unequipItem = useUnequipItem();

  const refreshUserData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey(character.id) }),
      queryClient.invalidateQueries({ queryKey: getGetCharacterQueryKey(character.id) }),
      queryClient.invalidateQueries({ queryKey: getGetCharactersQueryKey() }),
    ]);
  };

  const handleBuy = (itemId: string, price: number, itemName: string) => {
    if (character.gold < price) {
      toast({
        variant: "destructive",
        title: "Không đủ vàng!",
        description: `Bạn cần ${price} vàng nhưng chỉ có ${character.gold} vàng.`,
      });
      return;
    }

    buyItem.mutate(
      { characterId: character.id, itemId },
      {
        onSuccess: async (data) => {
          toast({
            title: "Mua thành công!",
            description: `Đã mua ${itemName} và cất vào Hành trang.`,
          });
          // Update gold in game stores
          useGameStore.getState().updatePlayerStatsAfterBattle({
            exp: data.character.experience,
            gold: data.character.gold,
            level: data.character.level,
            hp: data.character.hp,
            maxHp: data.character.maxHp,
          });
          useGameWorldStore.getState().updateAfterBattle({
            exp: data.character.experience,
            gold: data.character.gold,
            level: data.character.level,
            hp: data.character.hp,
            maxHp: data.character.maxHp,
          });
          await refreshUserData();
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Mua thất bại",
            description: err?.message || "Đã có lỗi xảy ra.",
          });
        },
      }
    );
  };

  const handleEquip = (item: InventoryItem) => {
    const mutation = item.equipped ? unequipItem : equipItem;
    mutation.mutate(
      { characterId: character.id, itemId: item.id },
      {
        onSuccess: async (updatedChar) => {
          toast({
            title: item.equipped ? "Đã tháo trang bị" : "Đã trang bị thành công",
            description: `${item.name} đã được cập nhật vào chỉ số chiến đấu.`,
          });
          useGameStore.getState().syncFromCharacter(updatedChar);
          useGameWorldStore.getState().syncFromBackendCharacter(updatedChar);
          await refreshUserData();
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Thao tác thất bại",
            description: err?.message || "Không thể cập nhật trang bị.",
          });
        },
      }
    );
  };

  return (
    <>
      {/* 0.0 Death & Town Respawn System Modal */}
      <PlayerDeathRespawnModal />

      {/* 0. GM Admin Floating Panel (F12 or /gm) */}
      <GMAdminPanel />

      {/* 0.1 Dungeon Selection Modal */}
      <DungeonSelectModal />

      {/* 0.2 Battle Report & History Modal */}
      <BattleReportModal characterId={character.id} />

      {/* 0.3 Achievements & Milestones Modal */}
      {activeModal === "achievements" && <AchievementsModal characterId={character.id} />}

      {/* 0.4 Daily 7-Day Login Rewards Modal */}
      {activeModal === "dailyRewards" && <DailyLoginModal characterId={character.id} />}

      {/* 0.5 Zone Transition Loading Screen */}
      <LoadingTransitionScreen />

      {/* 1. Character Attributes Panel (Point Allocation) */}
      {activeModal === "attributes" && <CharacterAttributesPanel />}

      {/* 2. Storyline Quests & Waypoints Log */}
      {activeModal === "quests" && <QuestLogModal />}

      {/* 3. Blacksmith +15 Forge & Crafting */}
      {activeModal === "blacksmith" && <BlacksmithModal />}

      {/* 3.1 Player Auction House (Alt+K) */}
      {activeModal === "auctionHouse" && <AuctionHouseModal />}

      {/* 3.2 Class Awakening & Talent Tree (Alt+N) */}
      {activeModal === "talents" && <TalentAndAwakeningModal />}

      {/* 3.3 Bestiary & Item Codex (Alt+L) */}
      {activeModal === "codex" && <CodexModal />}

      {/* 3.4 100-Map World Atlas (Alt+W) */}
      {activeModal === "worldAtlas" && <WorldAtlasModal />}

      {/* 4. Ranked 1v1 PvP Arena Matchmaking */}
      {activeModal === "pvpArena" && <PvPArenaModal />}

      {/* 4.1 Party System & Companion Bots (Alt+P) */}
      {activeModal === "party" && (
        <PartyModal
          characterId={character.id}
          onClose={closeActiveModal}
        />
      )}

      {/* 5. Character Inventory Dual Window */}
      {activeModal === "inventory" && (
        <CharacterInventoryModal
          character={character}
          inventory={inventory && inventory.length > 0 ? inventory : undefined}
          onEquip={handleEquip}
          onClose={closeActiveModal}
        />
      )}

      {/* 6. Shop Panel */}
      {activeModal === "shop" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeActiveModal();
          }}
        >
          <InventoryEquipmentPanel
            character={character}
            inventory={inventory}
            shopItems={shopItems}
            inventoryLoading={inventoryLoading}
            shopLoading={shopLoading}
            busy={equipItem.isPending || unequipItem.isPending || buyItem.isPending}
            initialSection="shop"
            onEquip={handleEquip}
            onBuy={(item) => handleBuy(item.id, item.price, item.name)}
            onClose={closeActiveModal}
          />
        </div>
      )}

      {/* 7. Shared Modals (Leaderboard, Settings) */}
      {(activeModal === "leaderboard" || activeModal === "settings") && (
        <div
          className={`fixed inset-0 z-50 flex transition-all duration-200 ${
            isSidePanel
              ? "items-center justify-end p-2 sm:p-4 pointer-events-none"
              : "items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md pointer-events-auto animate-in fade-in duration-200"
          }`}
          onClick={(e) => {
            if (!isSidePanel && e.target === e.currentTarget) {
              playButtonClick();
              closeActiveModal();
            }
          }}
        >
          <div
            className={`relative flex flex-col bg-[#0b0e14]/95 border border-slate-800/80 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.85)] overflow-hidden text-slate-100 pointer-events-auto backdrop-blur-xl transition-all duration-300 animate-in fade-in zoom-in-95 duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isSidePanel ? "w-full max-w-md max-h-[92vh] border-cyan-500/40 my-auto" : "w-full max-w-5xl max-h-[90vh] my-auto"
            }`}
          >
            {/* ── Modal Header ── */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                {activeModal === "leaderboard" && <Trophy className="w-5 h-5 text-purple-400" />}
                {activeModal === "settings" && <Settings className="w-5 h-5 text-cyan-400" />}

                <div>
                  <h2 className="text-base font-black tracking-wide text-white flex items-center gap-2">
                    {activeModal === "leaderboard" && "BẢNG VINH DANH"}
                    {activeModal === "settings" && "CÀI ĐẶT ĐIỀU KHIỂN"}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {activeModal === "leaderboard" && "Top chiến binh đại lục Long Tộc"}
                    {activeModal === "settings" && "Tinh chỉnh camera và hiệu ứng"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* [🗖 / 🗕] Side-Panel Mode Toggle */}
                <button
                  onClick={() => {
                    playButtonClick();
                    setIsSidePanel(!isSidePanel);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/60 transition cursor-pointer hover:scale-105 active:scale-95"
                  title={isSidePanel ? "Mở rộng toàn màn hình" : "Thu gọn về bên cạnh (Nhìn thấy game 3D)"}
                >
                  {isSidePanel ? <Maximize2 className="w-4 h-4 text-cyan-400" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    playButtonClick();
                    closeActiveModal();
                  }}
                  className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-red-500 hover:text-white border border-slate-700 text-slate-400 flex items-center justify-center transition-colors duration-150 cursor-pointer shadow-md hover:scale-110 active:scale-95"
                  title="Đóng (ESC)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

        {/* ── Modal Body (Scrollable) ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-4">
          {activeModal === "settings" && <GameSettingsPanel characterId={character.id} />}

          {/* 3. LEADERBOARD MODAL */}
          {activeModal === "leaderboard" && (
            <div>
              {leaderboardLoading ? (
                <div className="text-center py-12 text-slate-400">Đang tải bảng xếp hạng...</div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-12 text-slate-400">Chưa có dữ liệu xếp hạng</div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((hero, index) => {
                    const isTop1 = index === 0;
                    const isTop2 = index === 1;
                    const isTop3 = index === 2;

                    return (
                      <div
                        key={`${hero.characterName}-${index}`}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                          isTop1
                            ? "bg-amber-950/30 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                            : isTop2
                            ? "bg-slate-800/40 border-slate-500/40"
                            : isTop3
                            ? "bg-orange-950/20 border-orange-500/30"
                            : "bg-slate-900/60 border-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 text-center font-black text-base">
                            {isTop1 ? "🥇" : isTop2 ? "🥈" : isTop3 ? "🥉" : `#${index + 1}`}
                          </span>
                          <div>
                            <p className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                              {hero.characterName}
                              <span className="text-[10px] font-bold text-slate-400 font-mono">(@{hero.username})</span>
                            </p>
                            <p className="text-xs text-purple-400 font-semibold">{hero.className}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                            Cấp {hero.level}
                          </span>
                          <p className="text-xs text-slate-400 mt-1 font-mono">
                            ⚔️ {hero.kills} Quái
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── Modal Footer ── */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/30 flex items-center justify-between text-xs text-slate-400">
          <span>Nhấn <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono">ESC</kbd> để đóng</span>
          <button
            onClick={closeActiveModal}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
      )}
    </>
  );
});
