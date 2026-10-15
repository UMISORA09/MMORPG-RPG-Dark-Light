import { memo } from "react";
import { InventoryEquipmentPanel } from "./InventoryEquipmentPanel";
import { GameSettingsPanel } from "./GameSettingsPanel";
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
  useGetBattleLog,
  getGetBattleLogQueryKey,
  getGetCharacterQueryKey,
  getGetCharactersQueryKey,
  type Character,
  type InventoryItem,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useGameStore } from "../stores";
import { useToast } from "@/hooks/use-toast";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { 
  X, 
  Backpack, 
  ShoppingBag, 
  Trophy, 
  ScrollText, 
  Sword,
  Clock,
  Settings,
} from "lucide-react";

interface UnifiedOverlayModalsProps {
  character: Character;
}

export const UnifiedOverlayModals = memo(function UnifiedOverlayModals({
  character,
}: UnifiedOverlayModalsProps) {
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
  const isLogOpen = activeModal === "battleLog" || activeModal === "battle_logs";
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

  const { data: battleLogs = [], isLoading: logsLoading } = useGetBattleLog(
    character.id,
    { query: { queryKey: getGetBattleLogQueryKey(character.id), enabled: isLogOpen } }
  );

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
            description: `Đã mua ${itemName} và cất vào Túi đồ.`,
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

  if (!activeModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeActiveModal();
      }}
    >
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#342a2b] border border-[#5d4648] rounded-[28px] shadow-[0_30px_90px_rgba(0,0,0,0.7)] overflow-hidden text-slate-100">
        
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3">
            {activeModal === "inventory" && <Backpack className="w-6 h-6 text-cyan-400" />}
            {activeModal === "shop" && <ShoppingBag className="w-6 h-6 text-amber-400" />}
            {activeModal === "leaderboard" && <Trophy className="w-6 h-6 text-purple-400" />}
            {isLogOpen && <ScrollText className="w-6 h-6 text-red-400" />}
            {activeModal === "settings" && <Settings className="w-6 h-6 text-cyan-400" />}

            <div>
              <h2 className="text-lg font-black tracking-wide text-white flex items-center gap-2">
                {activeModal === "inventory" && "TÚI ĐỒ & TRANG BỊ"}
                {activeModal === "shop" && "NHÂN VẬT · CỬA HÀNG"}
                {activeModal === "leaderboard" && "BẢNG VINH DANH LONG TỘC"}
                {isLogOpen && "LỊCH SỬ CHIẾN BÁO"}
                {activeModal === "settings" && "CÀI ĐẶT ĐIỀU KHIỂN"}
              </h2>
              <p className="text-xs text-slate-400">
                {activeModal === "inventory" && "Quản lý trang bị để gia tăng sức mạnh chiến đấu thời gian thực"}
                {activeModal === "shop" && "Chọn vật phẩm phù hợp; chỉ số và trang bị luôn hiển thị bên trái"}
                {activeModal === "leaderboard" && "Top những chiến binh mạnh nhất đại lục Long Tộc"}
                {isLogOpen && "Ghi nhận các chiến tích tiêu diệt quái vật và Boss rồng"}
                {activeModal === "settings" && "Tinh chỉnh camera và hiệu ứng theo cách chơi của bạn"}
              </p>
            </div>
          </div>

          <button
            onClick={closeActiveModal}
            className="p-1.5 rounded-full bg-slate-800/60 hover:bg-red-500/20 hover:text-red-300 text-slate-400 border border-slate-700 transition"
            title="Đóng (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Modal Body (Scrollable) ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-4">
          
          {/* 1. INVENTORY MODAL */}
          {(activeModal === "inventory" || activeModal === "shop") && (
            <InventoryEquipmentPanel
              character={character}
              inventory={inventory}
              shopItems={shopItems}
              inventoryLoading={inventoryLoading}
              shopLoading={shopLoading}
              busy={equipItem.isPending || unequipItem.isPending || buyItem.isPending}
              initialSection={activeModal === "shop" ? "shop" : "storage"}
              onEquip={handleEquip}
              onBuy={(item) => handleBuy(item.id, item.price, item.name)}
            />
          )}

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

          {/* 4. BATTLE LOGS MODAL */}
          {isLogOpen && (
            <div>
              {logsLoading ? (
                <div className="text-center py-12 text-slate-400">Đang tải lịch sử chiến đấu...</div>
              ) : battleLogs.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Sword className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-slate-400 font-semibold">Chưa có chiến tích nào được ghi nhận!</p>
                  <p className="text-xs text-slate-500">Hãy bước ra Đấu Trường Hoang Dã để săn quái và nhận thưởng.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {battleLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                          log.victory ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-red-500/20 text-red-400 border border-red-500/40"
                        }`}>
                          {log.victory ? "WIN" : "LOSE"}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-200">
                            Hạ gục: <span className="text-amber-300">{log.monsterName}</span>
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span className="text-blue-400 font-mono">+{log.expGained} EXP</span>
                            <span>•</span>
                            <span className="text-yellow-400 font-mono">+{log.goldGained} Vàng</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                  ))}
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
  );
});
