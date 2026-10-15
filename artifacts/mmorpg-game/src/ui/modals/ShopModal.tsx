import { memo, useMemo } from "react";
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
import {
  X,
  ShoppingBag,
  Coins,
  Zap,
  Shield,
  Heart,
  Gauge,
  Sparkles,
  CheckCircle2,
  Lock,
} from "lucide-react";

export interface ShopModalProps {
  characterId?: number;
}

type ItemRarity = "common" | "rare" | "epic" | "legendary";

function getItemRarity(price: number): ItemRarity {
  if (price >= 1200) return "legendary";
  if (price >= 500) return "epic";
  if (price >= 200) return "rare";
  return "common";
}

const RARITY_STYLES: Record<
  ItemRarity,
  {
    border: string;
    bg: string;
    badge: string;
    glow: string;
    text: string;
    label: string;
  }
> = {
  common: {
    border: "border-slate-700/60 hover:border-slate-500/80",
    bg: "bg-slate-900/60 hover:bg-slate-900/80",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
    glow: "",
    text: "text-slate-300",
    label: "Thường",
  },
  rare: {
    border: "border-cyan-500/40 hover:border-cyan-400/80",
    bg: "bg-cyan-950/20 hover:bg-cyan-950/35",
    badge: "bg-cyan-950/80 text-cyan-300 border-cyan-700/60",
    glow: "shadow-[0_0_15px_rgba(6,182,212,0.15)]",
    text: "text-cyan-300",
    label: "Hiếm",
  },
  epic: {
    border: "border-purple-500/40 hover:border-purple-400/80",
    bg: "bg-purple-950/20 hover:bg-purple-950/35",
    badge: "bg-purple-950/80 text-purple-300 border-purple-700/60",
    glow: "shadow-[0_0_18px_rgba(168,85,247,0.2)]",
    text: "text-purple-300",
    label: "Sử Thi",
  },
  legendary: {
    border: "border-amber-500/60 hover:border-amber-400",
    bg: "bg-gradient-to-br from-amber-950/30 via-slate-900/80 to-amber-950/20 hover:from-amber-950/45",
    badge: "bg-gradient-to-r from-amber-600/40 to-yellow-600/40 text-amber-200 border-amber-500/60",
    glow: "shadow-[0_0_24px_rgba(245,158,11,0.28)] ring-1 ring-amber-500/30",
    text: "text-amber-300 font-black",
    label: "Huyền Thoại",
  },
};

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

  const shopItems = useMemo(
    () => (Array.isArray(rawShopItems) ? rawShopItems : []),
    [rawShopItems]
  );
  const inventory = useMemo(
    () => (Array.isArray(rawInventory) ? rawInventory : []),
    [rawInventory]
  );

  const handleBuy = (itemId: string, price: number, itemName: string) => {
    if (playerGold < price) {
      toast({
        variant: "destructive",
        title: "Không đủ vàng!",
        description: `Bạn cần ${price} vàng để mua ${itemName}.`,
      });
      return;
    }

    buyItem.mutate(
      { characterId: selectedCharId, itemId },
      {
        onSuccess: async (data) => {
          toast({
            title: "Mua thành công!",
            description: `Đã mua ${itemName} và cất vào Hành trang.`,
          });
          useGameStore.getState().updatePlayerStatsAfterBattle({
            exp: data.character.experience,
            gold: data.character.gold,
            level: data.character.level,
            hp: data.character.hp,
            maxHp: data.character.maxHp,
          });
          queryClient.invalidateQueries({
            queryKey: getGetInventoryQueryKey(selectedCharId),
          });
          queryClient.invalidateQueries({
            queryKey: getGetCharacterQueryKey(selectedCharId),
          });
          queryClient.invalidateQueries({
            queryKey: getGetCharactersQueryKey(),
          });
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none font-sans animate-in fade-in duration-200 pointer-events-auto"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-[#0b0616]/95 border-2 border-amber-500/40 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.95)] overflow-hidden text-slate-100 ring-1 ring-amber-400/20"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header - Cinema Slate & Dark Fantasy Gold */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-950/60">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wider text-amber-300 uppercase flex items-center gap-2">
                Cửa Hàng Thương Gia Long Tộc
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                  TRANG BỊ CAO CẤP
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Thần binh, bảo giáp và bảo vật gia tăng sức mạnh chiến đấu
              </p>
            </div>
          </div>

          <button
            onClick={close}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-red-500/20 hover:text-red-300 text-slate-400 border border-slate-700/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gold Bar Status */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900/60 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Ngân sách hiện tại:</span>
            <span className="px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 font-mono font-black text-sm flex items-center gap-1.5 shadow-inner">
              <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
              {playerGold.toLocaleString("vi-VN")} Vàng
            </span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Vật phẩm mua được sẽ chuyển thẳng vào Hành trang (Phím tắt: B / I)
          </span>
        </div>

        {/* Content Items Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4">
          {shopLoading ? (
            <div className="text-center py-16 text-slate-400 flex flex-col items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400 animate-spin" />
              <span>Đang mở rương hàng thương gia...</span>
            </div>
          ) : shopItems.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              Cửa hàng hiện chưa có vật phẩm nào được bày bán
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {shopItems.map((item) => {
                const isOwned = inventory.some((inv: any) => inv.id === item.id);
                const canAfford = playerGold >= item.price;
                const rarity = getItemRarity(item.price);
                const style = RARITY_STYLES[rarity];

                return (
                  <div
                    key={item.id}
                    className={`relative p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${style.border} ${style.bg} ${style.glow}`}
                  >
                    <div>
                      {/* Top Row: Name, Rarity Badge & Price */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{item.icon || "⚔️"}</span>
                            <span className={`font-bold text-sm truncate ${style.text}`}>
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${style.badge}`}
                            >
                              {style.label}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 uppercase">
                              {item.type === "weapon"
                                ? "Vũ Khí"
                                : item.type === "armor"
                                ? "Giáp Trụ"
                                : "Phụ Kiện"}
                            </span>
                          </div>
                        </div>

                        {/* Price Tag */}
                        <div className="px-2.5 py-1 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs flex items-center gap-1 shrink-0">
                          <Coins className="w-3.5 h-3.5 text-amber-400" />
                          {item.price.toLocaleString("vi-VN")}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                        {item.description || "Bảo vật quý giá được thợ rèn Long Tộc gia trì linh lực."}
                      </p>

                      {/* Attribute Boosts */}
                      <div className="flex flex-wrap gap-2 text-xs mb-3.5">
                        {item.atkBoost > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 font-mono text-[11px] flex items-center gap-1">
                            <Zap className="w-3 h-3 text-red-400" /> +{item.atkBoost} ATK
                          </span>
                        )}
                        {item.defBoost > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-300 font-mono text-[11px] flex items-center gap-1">
                            <Shield className="w-3 h-3 text-blue-400" /> +{item.defBoost} DEF
                          </span>
                        )}
                        {item.hpBoost > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] flex items-center gap-1">
                            <Heart className="w-3 h-3 text-emerald-400" /> +{item.hpBoost} HP
                          </span>
                        )}
                        {item.spdBoost > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-300 font-mono text-[11px] flex items-center gap-1">
                            <Gauge className="w-3 h-3 text-purple-400" /> +{item.spdBoost} SPD
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleBuy(item.id, item.price, item.name)}
                      disabled={buyItem.isPending || isOwned || !canAfford}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm ${
                        isOwned
                          ? "bg-slate-800/80 text-emerald-400 border border-emerald-500/40 cursor-default"
                          : canAfford
                          ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black shadow-amber-900/30 hover:scale-[1.01] active:scale-[0.99]"
                          : "bg-slate-800/60 text-slate-500 border border-slate-700/60 cursor-not-allowed"
                      }`}
                    >
                      {isOwned ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Đã Sở Hữu Trong Hành Trang
                        </>
                      ) : canAfford ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Mua Ngay ({item.price} Vàng)
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          Không Đủ Vàng
                        </>
                      )}
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
