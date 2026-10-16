import { memo, useState, useEffect } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { playCombatSFX } from "@/audio/CombatSoundSynth";
import {
  X,
  Flame,
  Hammer,
  Sparkles,
  Recycle,
  ChevronsUp,
  Shield,
  Coins,
  Check,
} from "lucide-react";

export const BlacksmithModal = memo(function BlacksmithModal() {
  const activeModal = useGameWorldStore((s) => s.activeModal);
  const closeActiveModal = useGameWorldStore((s) => s.closeActiveModal);
  const blacksmithTab = useGameWorldStore((s) => s.blacksmithTab);
  const setBlacksmithTab = useGameWorldStore((s) => s.setBlacksmithTab);
  const addFloatingText = useGameWorldStore((s) => s.addFloatingText);
  const playerPosition = useGameWorldStore((s) => s.playerPosition);
  const setHighestEnhanceLevel = useGameWorldStore((s) => s.setHighestEnhanceLevel);

  const [activeTab, setActiveTab] = useState<"enhance" | "dismantle" | "craft">(blacksmithTab || "enhance");
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedGear, setSelectedGear] = useState<any | null>(null);
  const [selectedDismantleIds, setSelectedDismantleIds] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [playerGold, setPlayerGold] = useState(1500);

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/characters/1/inventory");
      if (res.ok) {
        const data = await res.json();
        setInventory(data);
        const equipGears = data.filter((i: any) => i.item.category === "equipment");
        if (equipGears.length > 0 && !selectedGear) {
          setSelectedGear(equipGears[0]);
        }
      }
    } catch {
      // offline fallback
    }
  };

  useEffect(() => {
    if (activeModal === "blacksmith") {
      fetchInventory();
      if (blacksmithTab) setActiveTab(blacksmithTab);
    }
  }, [activeModal, blacksmithTab]);

  if (activeModal !== "blacksmith") return null;

  // ── Tab 1: Cường Hóa ──
  const handleEnhance = async () => {
    if (!selectedGear || isProcessing) return;
    setIsProcessing(true);
    playCombatSFX("heavy_slam", 0.5);

    try {
      const res = await fetch("/api/characters/1/blacksmith/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownershipId: selectedGear.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        playCombatSFX("level_up_fanfare", 0.6);
        addFloatingText(data.message, playerPosition.clone(), "#ffaa00");
        setHighestEnhanceLevel(data.newLevel);
        useGameWorldStore.getState().progressQuest("ENHANCE_ITEM", "any_equipment", 1);
        await fetchInventory();
        setSelectedGear((prev: any) => ({ ...prev, enhanceLevel: data.newLevel }));
      } else {
        playCombatSFX("blade_slash", 0.4);
        addFloatingText(data.message || "Cường hóa thất bại!", playerPosition.clone(), "#ef4444");
      }
    } catch {
      // offline simulation
      const nextLvl = (selectedGear.enhanceLevel || 0) + 1;
      addFloatingText(`🎉 Cường hóa thành công lên +${nextLvl}!`, playerPosition.clone(), "#ffaa00");
      setHighestEnhanceLevel(nextLvl);
      useGameWorldStore.getState().progressQuest("ENHANCE_ITEM", "any_equipment", 1);
      setSelectedGear((prev: any) => ({ ...prev, enhanceLevel: nextLvl }));
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Tab 2: Phân Giải ──
  const handleDismantle = async () => {
    if (selectedDismantleIds.length === 0 || isProcessing) return;
    setIsProcessing(true);
    playCombatSFX("heavy_slam", 0.4);

    try {
      const res = await fetch("/api/characters/1/blacksmith/dismantle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownershipIds: selectedDismantleIds }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addFloatingText(data.message, playerPosition.clone(), "#38bdf8");
        playCombatSFX("holy_bell", 0.5);
        setSelectedDismantleIds([]);
        await fetchInventory();
      }
    } catch {
      addFloatingText("♻️ Phân giải thành công!", playerPosition.clone(), "#38bdf8");
      setSelectedDismantleIds([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectAllCommon = () => {
    const commonIds = inventory
      .filter((i: any) => i.item.rarity === "common" && !i.equipped)
      .map((i: any) => i.id);
    setSelectedDismantleIds(commonIds);
    playCombatSFX("holy_bell", 0.3);
  };

  // ── Tab 3: Chế Tạo ──
  const handleCraft = async (recipeId: string, recipeName: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    playCombatSFX("heavy_slam", 0.5);

    try {
      const res = await fetch("/api/characters/1/blacksmith/craft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        playCombatSFX("level_up_fanfare", 0.6);
        addFloatingText(data.message, playerPosition.clone(), "#fbbf24");
        useGameWorldStore.getState().progressQuest("CRAFT_ITEM", "rare_gear", 1);
        await fetchInventory();
      } else {
        addFloatingText(data.error || "Không đủ nguyên liệu!", playerPosition.clone(), "#ef4444");
      }
    } catch {
      addFloatingText(`🎉 Chế tạo thành công ${recipeName}!`, playerPosition.clone(), "#fbbf24");
      useGameWorldStore.getState().progressQuest("CRAFT_ITEM", "rare_gear", 1);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentEnhance = selectedGear?.enhanceLevel || 0;
  const nextEnhance = currentEnhance + 1;
  const enhanceRate = currentEnhance < 5 ? 100 : currentEnhance < 10 ? Math.round((1 - (currentEnhance - 4) * 0.08) * 100) : Math.round((0.35 - (currentEnhance - 9) * 0.05) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl h-[600px] bg-[#0c101a] border border-amber-500/50 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(245,158,11,0.3)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Lò Rèn Thần Binh — Đại Sư Thiết Tâm
              </h2>
              <p className="text-xs text-slate-400">Cường hóa +15 phát sáng • Phân giải • Chế tạo Thần Khí</p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => { setActiveTab("enhance"); playCombatSFX("holy_bell", 0.25); }}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "enhance"
                  ? "bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ChevronsUp className="w-3.5 h-3.5" /> Cường Hóa (+15)
            </button>
            <button
              onClick={() => { setActiveTab("dismantle"); playCombatSFX("holy_bell", 0.25); }}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "dismantle"
                  ? "bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Recycle className="w-3.5 h-3.5" /> Phân Giải
            </button>
            <button
              onClick={() => { setActiveTab("craft"); playCombatSFX("holy_bell", 0.25); }}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "craft"
                  ? "bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Chế Tạo
            </button>
          </div>

          <button
            onClick={closeActiveModal}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-6">
          {/* ── TAB 1: CƯỜNG HÓA ── */}
          {activeTab === "enhance" && (
            <div className="h-full flex gap-6">
              {/* Left: Gear Selector */}
              <div className="w-1/3 border border-slate-800 rounded-2xl bg-slate-950/60 p-3 overflow-y-auto space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Trang Bị Có Thể Cường Hóa
                </h4>
                {inventory
                  .filter((i: any) => i.item.category === "equipment")
                  .map((i: any) => {
                    const isSelected = selectedGear?.id === i.id;
                    return (
                      <button
                        key={i.id}
                        onClick={() => { setSelectedGear(i); playCombatSFX("holy_bell", 0.25); }}
                        className={`w-full p-2.5 rounded-xl text-left border transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/20 border-amber-500 text-white"
                            : "bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{i.item.icon || "🛡️"}</span>
                          <div>
                            <p className="font-bold text-xs truncate max-w-[120px]">{i.item.name}</p>
                            <span className="text-[10px] text-amber-400 font-mono">
                              +{i.enhanceLevel || 0}
                            </span>
                          </div>
                        </div>
                        {i.equipped && (
                          <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-bold">
                            Đang Mặc
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>

              {/* Right: Anvil Forge Display */}
              <div className="flex-1 rounded-2xl bg-gradient-to-b from-[#1a1520] to-[#0c0e17] border border-amber-500/30 p-6 flex flex-col justify-between items-center relative overflow-hidden">
                {/* Forge Glow Effect */}
                <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />

                {/* Anvil Pedestal Slot */}
                <div className="text-center mt-4">
                  <div className="w-24 h-24 rounded-3xl bg-slate-900 border-2 border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.3)] mx-auto flex items-center justify-center text-4xl relative">
                    <span>{selectedGear?.item?.icon || "⚔️"}</span>
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs">
                      +{currentEnhance}
                    </span>
                  </div>
                  <h3 className="font-black text-base text-white mt-3">
                    {selectedGear?.item?.name || "Chọn Trang Bị"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Cấp tiếp theo: <span className="text-amber-400 font-bold font-mono">+{nextEnhance}</span> (+15% Tất cả chỉ số)
                  </p>
                </div>

                {/* Rate & Cost Stats */}
                <div className="w-full max-w-md grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Tỉ Lệ Thành Công</span>
                    <span className={`font-black font-mono text-sm ${enhanceRate > 50 ? "text-emerald-400" : "text-amber-400"}`}>
                      {enhanceRate}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Chi Phí Vàng</span>
                    <span className="font-black font-mono text-sm text-yellow-400">
                      {nextEnhance * 150} 🪙
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Đá Cường Hóa</span>
                    <span className="font-black font-mono text-sm text-cyan-400">
                      {currentEnhance < 5 ? 1 : currentEnhance < 10 ? 2 : 4} 💎
                    </span>
                  </div>
                </div>

                {/* Enhance Hammer Button */}
                <button
                  onClick={handleEnhance}
                  disabled={!selectedGear || isProcessing || currentEnhance >= 15}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.5)] transition active:scale-95 cursor-pointer disabled:opacity-40"
                >
                  <Hammer className="w-5 h-5 animate-bounce" />
                  <span>{isProcessing ? "Đang Cường Hóa..." : `ĐẬP ĐE CƯỜNG HÓA (+${nextEnhance})`}</span>
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 2: PHÂN GIẢI ── */}
          {activeTab === "dismantle" && (
            <div className="h-full flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <p className="text-xs text-slate-400">
                  Chọn trang bị không dùng để nung chảy thành Đá Cường Hóa & Quặng Thép.
                </p>
                <button
                  onClick={handleSelectAllCommon}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Chọn Hết Đồ Thường (Common)
                </button>
              </div>

              {/* Grid of Dismantle Items */}
              <div className="grid grid-cols-4 gap-3 overflow-y-auto max-h-[360px] py-3">
                {inventory
                  .filter((i: any) => i.item.category === "equipment" && !i.equipped)
                  .map((i: any) => {
                    const isSelected = selectedDismantleIds.includes(i.id);
                    return (
                      <button
                        key={i.id}
                        onClick={() => {
                          setSelectedDismantleIds((prev) =>
                            prev.includes(i.id) ? prev.filter((id) => id !== i.id) : [...prev, i.id]
                          );
                        }}
                        className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-rose-500/20 border-rose-500 text-white"
                            : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-base">{i.item.icon || "🛡️"}</span>
                          <div className="truncate">
                            <p className="font-bold text-xs truncate">{i.item.name}</p>
                            <span className="text-[10px] text-slate-400 capitalize">{i.item.rarity}</span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-rose-400 shrink-0" />}
                      </button>
                    );
                  })}
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Đã chọn: <strong className="text-white font-mono">{selectedDismantleIds.length}</strong> món đồ
                </span>
                <button
                  onClick={handleDismantle}
                  disabled={selectedDismantleIds.length === 0 || isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition disabled:opacity-40 shadow-[0_0_15px_rgba(244,63,94,0.4)] cursor-pointer"
                >
                  {isProcessing ? "Đang Phân Giải..." : `Nung Chảy (${selectedDismantleIds.length} món)`}
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 3: CHẾ TẠO ── */}
          {activeTab === "craft" && (
            <div className="h-full overflow-y-auto space-y-3 pr-2">
              {[
                {
                  id: "craft_rare_weapon",
                  name: "Vũ Khí Hiếm (Rare)",
                  desc: "Rèn vũ khí phẩm chất Xanh Lam với sức mạnh vượt trội cho hệ phái.",
                  gold: 450,
                  materials: "8 Quặng Huyền Thiết + 4 Đá Cường Hóa",
                },
                {
                  id: "craft_rare_armor",
                  name: "Chiến Giáp Hiếm (Rare)",
                  desc: "Gia tăng +12 DEF và +80 HP, bảo vệ vững chắc cho các cuộc viễn chinh.",
                  gold: 400,
                  materials: "6 Quặng Huyền Thiết + 3 Đá Cường Hóa",
                },
                {
                  id: "craft_epic_weapon",
                  name: "Thần Khí Sử Thi (Epic)",
                  desc: "Vũ khí tím mang linh hồn rồng lửa, tăng vọt +45 ATK và +6% Chí Mạng.",
                  gold: 1500,
                  materials: "20 Quặng Huyền Thiết + 12 Đá Cường Hóa + 5 Mảnh Hắc Ám",
                },
                {
                  id: "craft_legendary_weapon",
                  name: "Thần Binh Long Vương (Legendary)",
                  desc: "Tuyệt phẩm binh khí thế giới với ánh sáng rực rỡ và sát thương hủy diệt.",
                  gold: 4000,
                  materials: "3 Tinh Thể Rồng + 15 Mảnh Hắc Ám + 25 Đá Cường Hóa",
                },
                {
                  id: "craft_potion_bundle",
                  name: "Gói 5 Bình Máu Đại",
                  desc: "Chưng cất từ thảo dược và mảnh khoáng thạch, hồi 35% HP mỗi bình.",
                  gold: 150,
                  materials: "4 Mảnh Vỡ Hắc Ám",
                },
              ].map((recipe) => (
                <div
                  key={recipe.id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="font-extrabold text-sm text-white">{recipe.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{recipe.desc}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs font-mono font-bold">
                      <span className="text-yellow-400">🪙 {recipe.gold} Vàng</span>
                      <span className="text-cyan-400">📦 {recipe.materials}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCraft(recipe.id, recipe.name)}
                    disabled={isProcessing}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0 cursor-pointer"
                  >
                    Rèn Ngay
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

