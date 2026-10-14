import { memo } from "react";
import {
  useGetItems,
  getGetItemsQueryKey,
  useGetInventory,
  getGetInventoryQueryKey,
  useBuyItem,
  getGetCharacterQueryKey,
  getGetCharactersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { useGameStore } from "@/stores";
import { useToast } from "@/hooks/use-toast";
import { X, ShoppingBag, Coins, Zap, Shield, Heart, Gauge } from "lucide-react";

export interface ShopModalProps {
  characterId?: number;
}

export const ShopModal = memo(function ShopModal({ characterId }: ShopModalProps) {
  const activeModal = useGameWorldStore((s) => s.activeModal);
  const legacyModal = useGameStore((s) => s.game.activeModal);
  const isOpen = activeModal === "shop" || legacyModal === "shop";

  const close = () => {
    useGameWorldStore.getState().closeActiveModal();
    useGameStore.getState().closeActiveModal();
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const selectedCharId =
    characterId ||
    (typeof window !== "undefined"
      ? Number(localStorage.getItem("selectedCharacterId")) || 1
      : 1);

  const playerGold = useGameWorldStore((s) => s.playerGold);

  const { data: rawShopItems = [], isLoading: shopLoading } = useGetItems({
    query: {
      queryKey: getGetItemsQueryKey(),
      enabled: isOpen,
    },
  });

  const { data: rawInventory = [] } = useGetInventory(selectedCharId, {
    query: {
      queryKey: getGetInventoryQueryKey(selectedCharId),
      enabled: isOpen && !!selectedCharId,
    },
  });

  const buyItem = useBuyItem();

  const shopItems = Array.isArray(rawShopItems) ? rawShopItems : [];
  const inventory = Array.isArray(rawInventory) ? rawInventory : [];

  const handleBuy = (itemId: string, price: number, itemName: string) => {
    if (playerGold < price) {
      toast({
        variant: "destructive",
        title: "Không đủ vàng!",
        description: `Bạn cần ${price} vàng để mua vật phẩm này.`,
      });
      return;
    }

    buyItem.mutate(
      { characterId: selectedCharId, itemId },
      {
        onSuccess: async (data) => {
          toast({
            title: "Mua thành công!",
            description: `Đã mua ${itemName} và cất vào Túi đồ.`,
          });
          useGameStore.getState().updatePlayerStatsAfterBattle({
            exp: data.character.experience,
            gold: data.character.gold,
            level: data.character.level,
            hp: data.character.hp,
            maxHp: data.character.maxHp,
          });
          queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey(selectedCharId) });
          queryClient.invalidateQueries({ queryKey: getGetCharacterQueryKey(selectedCharId) });
          queryClient.invalidateQueries({ queryKey: getGetCharactersQueryKey() });
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md select-none font-sans animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-slate-950/95 border border-slate-700/80 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-lg font-black tracking-wide text-white uppercase flex items-center gap-2">
                Cửa Hàng Thương Gia Long Tộc
              </h2>
              <p className="text-xs text-slate-400">
                Mua sắm thần binh, giáp trụ và phụ kiện gia tăng chỉ số
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="p-1.5 rounded-full bg-slate-800/80 hover:bg-red-500/20 hover:text-red-300 text-slate-400 border border-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between mb-3 px-1 text-xs text-slate-400">
            <span>
              Vàng hiện có:{" "}
              <strong className="text-amber-400 font-mono text-sm">{playerGold} 🪙</strong>
            </span>
            <span>Thương nhân uy tín Làng Long Tộc</span>
          </div>

          {shopLoading ? (
            <div className="text-center py-12 text-slate-400">Đang tải cửa hàng...</div>
          ) : shopItems.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Cửa hàng hiện chưa có vật phẩm nào</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {shopItems.map((item) => {
                const isOwned = inventory.some((inv: any) => inv.id === item.id);
                const canAfford = playerGold >= item.price;

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
                            {item.type === "weapon"
                              ? "Vũ Khí"
                              : item.type === "armor"
                              ? "Giáp Trụ"
                              : "Phụ Kiện"}
                          </span>
                        </div>
                        <span className="text-amber-400 font-bold font-mono text-xs flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" /> {item.price}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 mb-2">{item.description}</p>

                      <div className="flex flex-wrap gap-2 text-xs mb-3">
                        {item.atkBoost > 0 && (
                          <span className="text-amber-400 font-mono flex items-center gap-0.5">
                            <Zap className="w-3 h-3" /> +{item.atkBoost} ATK
                          </span>
                        )}
                        {item.defBoost > 0 && (
                          <span className="text-blue-400 font-mono flex items-center gap-0.5">
                            <Shield className="w-3 h-3" /> +{item.defBoost} DEF
                          </span>
                        )}
                        {item.hpBoost > 0 && (
                          <span className="text-emerald-400 font-mono flex items-center gap-0.5">
                            <Heart className="w-3 h-3" /> +{item.hpBoost} HP
                          </span>
                        )}
                        {item.spdBoost > 0 && (
                          <span className="text-purple-400 font-mono flex items-center gap-0.5">
                            <Gauge className="w-3 h-3" /> +{item.spdBoost} SPD
                          </span>
                        )}
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
                      {isOwned
                        ? "Đã Sở Hữu"
                        : canAfford
                        ? `Mua Với ${item.price} Vàng`
                        : "Không Đủ Vàng"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ShopModal;
