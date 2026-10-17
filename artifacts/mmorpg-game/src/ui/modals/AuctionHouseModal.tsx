// ==============================================================================
// AuctionHouseModal.tsx — Chợ Đấu Giá Liên Người Chơi (Player Auction House)
// Zero SQL Foreign Keys, Giao Dịch Nguyên Tử db.transaction() & Thuế Sàn 5%
// Phím tắt mở nhanh: Alt + K
// ==============================================================================

import { memo, useState, useEffect } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { useToast } from "@/hooks/use-toast";
import { playCombatSFX, playButtonClick } from "@/audio/CombatSoundSynth";
import { ItemTooltipCard, type ItemTooltipData } from "../tooltips/ItemTooltipCard";
import {
  X,
  Store,
  Tag,
  Coins,
  Search,
  Filter,
  PackagePlus,
  RefreshCw,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
  Trash2,
} from "lucide-react";

interface ListingItem {
  id: number;
  sellerCharacterId: number;
  sellerName: string;
  itemId: string;
  itemName: string;
  itemCategory: string;
  itemType: string;
  itemEquipSlot: string;
  itemRarity: string;
  enhanceLevel: number;
  bonusCombatPower: number;
  priceGold: number;
  status: string;
  socketsJson?: any;
  reforgeStatsJson?: any;
  createdAt: string;
}

export const AuctionHouseModal = memo(function AuctionHouseModal() {
  const closeActiveModal = useGameWorldStore((s) => s.closeActiveModal);
  const activeCharacterId = useGameWorldStore((s) => s.activeCharacterId);
  const playerGold = useGameWorldStore((s) => s.playerGold);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"browse" | "sell" | "my_listings">("browse");
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [myListings, setMyListings] = useState<ListingItem[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredItemTooltip, setHoveredItemTooltip] = useState<ItemTooltipData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filters for Browse
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRarity, setSelectedRarity] = useState("all");
  const [minEnhance, setMinEnhance] = useState("0");

  // Sell state
  const [selectedSellItem, setSelectedSellItem] = useState<any | null>(null);
  const [sellPrice, setSellPrice] = useState("1000");

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/market/listings?rarity=${selectedRarity}&search=${searchQuery}&minEnhance=${minEnhance}`);
      const data = await res.json();
      if (data.success) {
        setListings(data.listings || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyListings = async () => {
    if (!activeCharacterId) return;
    try {
      const res = await fetch(`/api/market/my-listings/${activeCharacterId}`);
      const data = await res.json();
      if (data.success) {
        setMyListings(data.listings || []);
      }
    } catch {
      // ignore
    }
  };

  const fetchInventory = async () => {
    if (!activeCharacterId) return;
    try {
      const res = await fetch(`/api/characters/${activeCharacterId}/inventory`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setInventory(data.filter((it) => !it.equipped));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchListings();
    fetchInventory();
    fetchMyListings();
  }, [activeTab, selectedRarity, minEnhance]);

  const handleBuy = async (listing: ListingItem) => {
    if (!activeCharacterId) return;
    if (playerGold < listing.priceGold) {
      toast({
        title: "Không đủ Vàng!",
        description: `Bạn cần ${listing.priceGold.toLocaleString()} Vàng để mua món đồ này.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(`/api/market/buy/${listing.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerCharacterId: activeCharacterId }),
      });
      const data = await res.json();
      if (data.success) {
        playCombatSFX("coin_chime", 0.6);
        toast({
          title: "🎉 Mua Thành Công!",
          description: data.message,
        });
        useGameWorldStore.setState({ playerGold: data.buyerGoldLeft });
        fetchListings();
        fetchInventory();
      } else {
        toast({
          title: "Giao Dịch Thất Bại",
          description: data.error || "Không thể mua vật phẩm",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Lỗi kết nối",
        description: "Không thể kết nối đến máy chủ chợ",
        variant: "destructive",
      });
    }
  };

  const handleSell = async () => {
    if (!selectedSellItem || !activeCharacterId) return;
    const price = parseInt(sellPrice, 10);
    if (isNaN(price) || price < 10) {
      toast({
        title: "Giá bán không hợp lệ",
        description: "Vui lòng đặt giá tối thiểu từ 10 Vàng trở lên.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch("/api/market/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: activeCharacterId,
          ownershipId: selectedSellItem.ownershipId || selectedSellItem.id,
          priceGold: price,
        }),
      });
      const data = await res.json();
      if (data.success) {
        playCombatSFX("coin_chime", 0.5);
        toast({
          title: "Đăng Bán Thành Công!",
          description: data.message,
        });
        setSelectedSellItem(null);
        fetchListings();
        fetchInventory();
        fetchMyListings();
        setActiveTab("my_listings");
      } else {
        toast({
          title: "Đăng Bán Thất Bại",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể kết nối đến máy chủ chợ",
        variant: "destructive",
      });
    }
  };

  const handleCancelListing = async (listingId: number) => {
    if (!activeCharacterId) return;
    try {
      const res = await fetch(`/api/market/cancel/${listingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: activeCharacterId }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Đã Hủy Đăng Bán",
          description: data.message,
        });
        fetchMyListings();
        fetchInventory();
      } else {
        toast({ title: "Lỗi", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Lỗi kết nối", variant: "destructive" });
    }
  };

  const rarityColor = (r: string) => {
    switch (r?.toLowerCase()) {
      case "miracle": return "border-fuchsia-500 text-fuchsia-300 bg-fuchsia-950/40 shadow-[0_0_15px_rgba(217,70,239,0.4)]";
      case "legendary": return "border-amber-500 text-amber-300 bg-amber-950/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]";
      case "epic": return "border-purple-500 text-purple-300 bg-purple-950/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]";
      case "rare": return "border-cyan-500 text-cyan-300 bg-cyan-950/40";
      default: return "border-slate-700 text-slate-300 bg-slate-900/60";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-md select-none font-sans">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0b0e14]/95 border border-slate-800/80 shadow-[0_8px_32px_rgba(0,0,0,0.85),0_0_30px_rgba(0,242,255,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-950/80 via-[#0a101f] to-cyan-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-400 shadow-[0_0_15px_#00f2ff]">
              <Store className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-wide uppercase drop-shadow">
                  Chợ Đấu Giá Liên Server
                </h2>
                <span className="font-mono text-[10px] font-black text-amber-300 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400">
                  Alt + K
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Giao thương mua bán trang bị & vật phẩm trực tuyến giữa toàn bộ người chơi • Thuế sàn 5%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Player Gold Pill */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-black/60 border border-amber-500/50 shadow-inner">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="font-mono text-sm font-black text-amber-300">
                {playerGold.toLocaleString()} Vàng
              </span>
            </div>

            <button
              onClick={() => {
                playButtonClick();
                closeActiveModal();
              }}
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-red-500 hover:text-white border border-slate-700 text-slate-400 flex items-center justify-center transition-colors duration-150 cursor-pointer shadow-md hover:scale-110 active:scale-95"
              title="Đóng Chợ Đấu Giá"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-[#060a12]">
          <button
            onClick={() => setActiveTab("browse")}
            className={`px-5 py-2.5 text-xs font-black uppercase rounded-t-xl transition cursor-pointer border-t border-x ${
              activeTab === "browse"
                ? "bg-[#090d16] border-cyan-500/60 text-cyan-300 shadow-[0_-5px_15px_rgba(6,182,212,0.15)]"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            🏪 Mua Vật Phẩm
          </button>
          <button
            onClick={() => setActiveTab("sell")}
            className={`px-5 py-2.5 text-xs font-black uppercase rounded-t-xl transition cursor-pointer border-t border-x ${
              activeTab === "sell"
                ? "bg-[#090d16] border-cyan-500/60 text-cyan-300 shadow-[0_-5px_15px_rgba(6,182,212,0.15)]"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            📤 Đăng Bán Đồ Của Tôi
          </button>
          <button
            onClick={() => setActiveTab("my_listings")}
            className={`px-5 py-2.5 text-xs font-black uppercase rounded-t-xl transition cursor-pointer border-t border-x ${
              activeTab === "my_listings"
                ? "bg-[#090d16] border-cyan-500/60 text-cyan-300 shadow-[0_-5px_15px_rgba(6,182,212,0.15)]"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            📋 Hàng Đang Rao Bán ({myListings.length})
          </button>
        </div>

        {/* Tab 1: MUA VẬT PHẨM (BROWSE) */}
        {activeTab === "browse" && (
          <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto min-h-[460px]">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-black/40 border border-slate-800">
              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-cyan-400" />
                <input
                  type="text"
                  placeholder="Tìm tên trang bị hoặc người bán..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") fetchListings(); }}
                  className="w-full bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 text-xs">
                {/* Rarity Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px]">Phẩm chất:</span>
                  <select
                    value={selectedRarity}
                    onChange={(e) => setSelectedRarity(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1 focus:outline-none"
                  >
                    <option value="all">Tất cả</option>
                    <option value="rare">Hiếm (Rare)</option>
                    <option value="epic">Sử Thi (Epic)</option>
                    <option value="legendary">Huyền Thoại</option>
                    <option value="miracle">Kì Tích (Miracle)</option>
                  </select>
                </div>

                {/* Min Enhance Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px]">Cường hóa:</span>
                  <select
                    value={minEnhance}
                    onChange={(e) => setMinEnhance(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1 focus:outline-none"
                  >
                    <option value="0">+0 trở lên</option>
                    <option value="5">+5 trở lên</option>
                    <option value="8">+8 trở lên</option>
                    <option value="10">+10 trở lên</option>
                  </select>
                </div>

                <button
                  onClick={fetchListings}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Lọc</span>
                </button>
              </div>
            </div>

            {/* Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 flex-1">
              {listings.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center p-12 text-slate-500 gap-2">
                  <Tag className="w-10 h-10 stroke-1" />
                  <p className="text-sm">Hiện không có vật phẩm nào phù hợp với bộ lọc tìm kiếm.</p>
                </div>
              ) : (
                listings.map((l) => (
                  <div
                    key={l.id}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipPos({ x: rect.right + 12, y: Math.max(20, rect.top) });
                      setHoveredItemTooltip({
                        name: l.itemName,
                        rarity: l.itemRarity,
                        enhanceLevel: l.enhanceLevel,
                        category: l.itemCategory,
                        equipSlot: l.itemEquipSlot,
                        requiredLevel: 5,
                        atkBoost: l.bonusCombatPower ? Math.round(l.bonusCombatPower * 0.4) : 40,
                        defBoost: l.bonusCombatPower ? Math.round(l.bonusCombatPower * 0.3) : 25,
                        hpBoost: l.bonusCombatPower ? Math.round(l.bonusCombatPower * 2.0) : 150,
                        price: l.priceGold,
                        socketsJson: l.socketsJson,
                        reforgeStatsJson: l.reforgeStatsJson,
                        lore: "Trang bị được niêm yết trên Chợ Đấu Giá Liên Server.",
                      });
                    }}
                    onMouseLeave={() => setHoveredItemTooltip(null)}
                    className={`flex flex-col justify-between p-3.5 rounded-2xl border-2 transition hover:scale-[1.02] ${rarityColor(l.itemRarity)}`}
                  >
                    <div>
                      {/* Title & Seller */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                            <span>{l.itemName}</span>
                            {l.enhanceLevel > 0 && (
                              <span className="font-mono text-xs text-amber-400 font-extrabold">
                                +{l.enhanceLevel}
                              </span>
                            )}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Người bán: <span className="text-slate-200 font-bold">{l.sellerName}</span> • Lực chiến: +{l.bonusCombatPower}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-black/60 font-bold border border-current">
                          {l.itemRarity}
                        </span>
                      </div>

                      {/* Gems & Sub-stats preview */}
                      <div className="mt-2.5 flex flex-col gap-1 text-[11px] font-mono bg-black/50 p-2 rounded-xl border border-slate-800">
                        {Array.isArray(l.socketsJson) && l.socketsJson.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400">Ngọc:</span>
                            {l.socketsJson.map((s: any, idx: number) => (
                              <span key={idx} className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-amber-300">
                                {s.gemType === "ruby" ? "🔴 Hồng Ngọc" : s.gemType === "sapphire" ? "🔵 Lam Ngọc" : s.gemType === "topaz" ? "🟡 Hoàng Ngọc" : "🟢 Lục Ngọc"} Lv.{s.level}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">Chưa khảm ngọc</span>
                        )}

                        {Array.isArray(l.reforgeStatsJson) && l.reforgeStatsJson.length > 0 && (
                          <div className="flex flex-col gap-0.5 mt-1 border-t border-slate-800/80 pt-1">
                            {l.reforgeStatsJson.map((r: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-[10px]">
                                <span className="text-slate-300">[{r.rank}] {r.name}:</span>
                                <span className="text-emerald-400 font-bold">+{r.value}{r.suffix}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price & Buy Button */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-1.5 font-mono text-sm font-black text-amber-300">
                        <Coins className="w-4 h-4 text-amber-400" />
                        <span>{l.priceGold.toLocaleString()} Vàng</span>
                      </div>

                      <button
                        onClick={() => handleBuy(l)}
                        disabled={playerGold < l.priceGold}
                        className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase transition cursor-pointer flex items-center gap-1.5 ${
                          playerGold < l.priceGold
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                            : "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                        }`}
                      >
                        <span>🪙 Mua Ngay</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: ĐĂNG BÁN ĐỒ CỦA TÔI (SELL) */}
        {activeTab === "sell" && (
          <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
            {/* Left: Inventory Picker */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-black text-cyan-300 uppercase tracking-wider">
                1. Chọn vật phẩm không dùng trong túi đồ
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-3 rounded-2xl bg-black/40 border border-slate-800 max-h-[360px] overflow-y-auto">
                {inventory.length === 0 ? (
                  <div className="col-span-full p-8 text-center text-xs text-slate-500">
                    Túi đồ của bạn không có trang bị nào để bán.
                  </div>
                ) : (
                  inventory.map((item) => (
                    <button
                      key={item.ownershipId || item.id}
                      onClick={() => setSelectedSellItem(item)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer relative ${
                        selectedSellItem?.ownershipId === item.ownershipId
                          ? "bg-cyan-500/30 border-cyan-400 shadow-[0_0_15px_#00f2ff]"
                          : "bg-slate-900 border-slate-800 hover:border-slate-600"
                      }`}
                    >
                      <span className="text-xl select-none">{item.icon || "⚔️"}</span>
                      <span className="text-[9px] font-bold text-slate-300 truncate max-w-[50px] mt-1">
                        {item.name}
                      </span>
                      {item.enhanceLevel > 0 && (
                        <span className="absolute top-1 right-1 font-mono text-[8px] font-black text-amber-400">
                          +{item.enhanceLevel}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right: Price & Confirm */}
            <div className="flex flex-col justify-between p-5 rounded-2xl bg-black/50 border border-slate-800">
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-black text-cyan-300 uppercase tracking-wider">
                  2. Định giá niêm yết lên Chợ
                </h3>

                {selectedSellItem ? (
                  <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/40 flex items-center gap-3">
                    <span className="text-3xl">{selectedSellItem.icon || "⚔️"}</span>
                    <div>
                      <h4 className="text-sm font-black text-white">
                        {selectedSellItem.name} {selectedSellItem.enhanceLevel > 0 && `+${selectedSellItem.enhanceLevel}`}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Phẩm chất: <span className="text-amber-300 uppercase">{selectedSellItem.rarity}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-700 text-center text-xs text-slate-500">
                    Vui lòng chọn một món đồ bên cạnh để bán
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-bold">Giá Vàng muốn bán:</label>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-black/80 border border-slate-700">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <input
                      type="number"
                      min="10"
                      max="99999999"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(e.target.value)}
                      className="w-full bg-transparent border-none text-sm font-mono font-black text-amber-300 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Thuế sàn giao dịch (5%): Bạn sẽ nhận được{" "}
                    <strong className="text-emerald-400">
                      {Math.floor(parseInt(sellPrice || "0", 10) * 0.95).toLocaleString()} Vàng
                    </strong>{" "}
                    khi bán thành công.
                  </span>
                </div>
              </div>

              <button
                disabled={!selectedSellItem}
                onClick={handleSell}
                className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 mt-4 ${
                  !selectedSellItem
                    ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                }`}
              >
                <PackagePlus className="w-4 h-4" />
                <span>📤 Xác Nhận Đăng Lên Chợ</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: HÀNG ĐANG RAO BÁN CỦA TÔI (MY LISTINGS) */}
        {activeTab === "my_listings" && (
          <div className="flex-1 p-6 flex flex-col gap-3 overflow-y-auto">
            {myListings.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                Bạn hiện không có món hàng nào đang rao bán trên chợ.
              </div>
            ) : (
              myListings.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚔️</span>
                    <div>
                      <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>{l.itemName}</span>
                        {l.enhanceLevel > 0 && <span className="text-amber-400">+{l.enhanceLevel}</span>}
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase ${l.status === "ACTIVE" ? "bg-emerald-950 text-emerald-400 border border-emerald-700" : "bg-slate-800 text-slate-400"}`}>
                          {l.status === "ACTIVE" ? "Đang bán" : l.status}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Giá: <span className="text-amber-300 font-bold">{l.priceGold.toLocaleString()} Vàng</span>
                      </p>
                    </div>
                  </div>

                  {l.status === "ACTIVE" && (
                    <button
                      onClick={() => handleCancelListing(l.id)}
                      className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-700 text-red-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hủy Bán</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Floating Smart Tooltip Card */}
        {hoveredItemTooltip && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: `${Math.min(window.innerWidth - 340, tooltipPos.x)}px`,
              top: `${Math.min(window.innerHeight - 380, tooltipPos.y)}px`,
            }}
          >
            <ItemTooltipCard item={hoveredItemTooltip} />
          </div>
        )}

      </div>
    </div>
  );
});
