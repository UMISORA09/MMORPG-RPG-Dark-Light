import { memo } from "react";
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
  Shield, 
  Zap, 
  Heart, 
  Gauge, 
  Coins, 
  CheckCircle, 
  Sparkles,
  Sword,
  Clock
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
    query: { queryKey: getGetItemsQueryKey(), enabled: activeModal === "shop" },
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
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-slate-950/90 border border-slate-700/80 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden text-slate-100 backdrop-blur-2xl">
        
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3">
            {activeModal === "inventory" && <Backpack className="w-6 h-6 text-cyan-400" />}
            {activeModal === "shop" && <ShoppingBag className="w-6 h-6 text-amber-400" />}
            {activeModal === "leaderboard" && <Trophy className="w-6 h-6 text-purple-400" />}
            {isLogOpen && <ScrollText className="w-6 h-6 text-red-400" />}

            <div>
              <h2 className="text-lg font-black tracking-wide text-white flex items-center gap-2">
                {activeModal === "inventory" && "TÚI ĐỒ & TRANG BỊ"}
                {activeModal === "shop" && "CỬA HÀNG THƯƠNG GIA LONG TỘC"}
                {activeModal === "leaderboard" && "BẢNG VINH DANH LONG TỘC"}
                {isLogOpen && "LỊCH SỬ CHIẾN BÁO"}
              </h2>
              <p className="text-xs text-slate-400">
                {activeModal === "inventory" && "Quản lý trang bị để gia tăng sức mạnh chiến đấu thời gian thực"}
                {activeModal === "shop" && "Mua sắm thần binh, giáp trụ và phụ kiện gia tăng chỉ số"}
                {activeModal === "leaderboard" && "Top những chiến binh mạnh nhất đại lục Long Tộc"}
                {isLogOpen && "Ghi nhận các chiến tích tiêu diệt quái vật và Boss rồng"}
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
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4">
          
          {/* 1. INVENTORY MODAL */}
          {activeModal === "inventory" && (
            <div>
              {inventoryLoading ? (
                <div className="text-center py-12 text-slate-400">Đang tải túi đồ...</div>
              ) : inventory.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Backpack className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-slate-400 font-semibold">Túi đồ của bạn đang trống!</p>
                  <p className="text-xs text-slate-500">Hãy ghé qua Cửa Hàng (phím B) để sắm thêm thần khí.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inventory.map((item) => (
                    <div
                      key={item.ownershipId}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                        item.equipped
                          ? "bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <span className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                              {item.icon || "⚔️"} {item.name}
                            </span>
                            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                              {item.type === "weapon" ? "Vũ Khí" : item.type === "armor" ? "Giáp Trụ" : "Phụ Kiện"}
                            </span>
                          </div>
                          {item.equipped && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Đang Mặc
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2 mb-2">{item.description}</p>

                        {/* Stat boosts */}
                        <div className="flex flex-wrap gap-2 text-xs mb-3">
                          {item.atkBoost > 0 && (
                            <span className="text-amber-400 flex items-center gap-0.5 font-mono">
                              <Zap className="w-3 h-3" /> +{item.atkBoost} Công
                            </span>
                          )}
                          {item.defBoost > 0 && (
                            <span className="text-blue-400 flex items-center gap-0.5 font-mono">
                              <Shield className="w-3 h-3" /> +{item.defBoost} Thủ
                            </span>
                          )}
                          {item.hpBoost > 0 && (
                            <span className="text-emerald-400 flex items-center gap-0.5 font-mono">
                              <Heart className="w-3 h-3" /> +{item.hpBoost} Máu
                            </span>
                          )}
                          {item.spdBoost > 0 && (
                            <span className="text-purple-400 flex items-center gap-0.5 font-mono">
                              <Gauge className="w-3 h-3" /> +{item.spdBoost} Tốc
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Equip / Unequip Button */}
                      <button
                        onClick={() => handleEquip(item)}
                        disabled={equipItem.isPending || unequipItem.isPending}
                        className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          item.equipped
                            ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                            : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-900/30"
                        }`}
                      >
                        {item.equipped ? "Tháo Ra" : "Trang Bị"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. SHOP MODAL */}
          {activeModal === "shop" && (
            <div>
              <div className="flex items-center justify-between mb-3 px-1 text-xs text-slate-400">
                <span>Vàng hiện có: <strong className="text-amber-400 font-mono text-sm">{character.gold} 🪙</strong></span>
                <span>Thương nhân uy tín Làng Long Tộc</span>
              </div>

              {shopLoading ? (
                <div className="text-center py-12 text-slate-400">Đang tải cửa hàng...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shopItems.map((item) => {
                    const isOwned = inventory.some((inv) => inv.id === item.id);
                    const canAfford = character.gold >= item.price;

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div>
                              <span className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                                {item.icon || "⚔️"} {item.name}
                              </span>
                              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                                {item.type === "weapon" ? "Vũ Khí" : item.type === "armor" ? "Giáp Trụ" : "Phụ Kiện"}
                              </span>
                            </div>
                            <span className="text-amber-400 font-bold font-mono text-xs flex items-center gap-1">
                              <Coins className="w-3.5 h-3.5" /> {item.price}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 line-clamp-2 mb-2">{item.description}</p>

                          {/* Stats */}
                          <div className="flex flex-wrap gap-2 text-xs mb-3">
                            {item.atkBoost > 0 && <span className="text-amber-400 font-mono">+{item.atkBoost} ATK</span>}
                            {item.defBoost > 0 && <span className="text-blue-400 font-mono">+{item.defBoost} DEF</span>}
                            {item.hpBoost > 0 && <span className="text-emerald-400 font-mono">+{item.hpBoost} HP</span>}
                            {item.spdBoost > 0 && <span className="text-purple-400 font-mono">+{item.spdBoost} SPD</span>}
                          </div>
                        </div>

                        <button
                          onClick={() => handleBuy(item.id, item.price, item.name)}
                          disabled={buyItem.isPending || isOwned || !canAfford}
                          className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            isOwned
                              ? "bg-slate-800/80 text-slate-500 border border-slate-700/60 cursor-not-allowed"
                              : canAfford
                              ? "bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black shadow-md shadow-amber-900/30"
                              : "bg-slate-800/60 text-slate-500 cursor-not-allowed"
                          }`}
                        >
                          {isOwned ? "Đã Sở Hữu" : canAfford ? `Mua Với ${item.price} Vàng` : "Không Đủ Vàng"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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
