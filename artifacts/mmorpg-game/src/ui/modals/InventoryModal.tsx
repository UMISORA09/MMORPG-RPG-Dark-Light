// ==============================================================================
// AAA Glassmorphism Inventory Modal
// Displays Acquired 3D Loot, Item Rarity Tiers, Equip/Unequip Actions & Stat Bonuses
// ==============================================================================

import { memo, useState } from "react";
import { useGameWorldStore, type CharacterInventoryItem } from "@/stores/useGameWorldStore";
import { X, Shield, Sword, Heart, Zap, Sparkles, Check } from "lucide-react";

export const InventoryModal = memo(function InventoryModal() {
  const activeModal = useGameWorldStore((s) => s.activeModal);
  const closeActiveModal = useGameWorldStore((s) => s.closeActiveModal);
  const inventoryItems = useGameWorldStore((s) => s.inventoryItems);
  const equipItem = useGameWorldStore((s) => s.equipItem);
  const playerGold = useGameWorldStore((s) => s.playerGold);
  const playerName = useGameWorldStore((s) => s.playerName);
  const playerClassName = useGameWorldStore((s) => s.playerClassName);
  const playerLevel = useGameWorldStore((s) => s.playerLevel);
  const playerHealth = useGameWorldStore((s) => s.playerHealth);
  const playerMaxHealth = useGameWorldStore((s) => s.playerMaxHealth);

  const [selectedItem, setSelectedItem] = useState<CharacterInventoryItem | null>(null);

  if (activeModal !== "inventory") return null;

  const currentSelection = selectedItem || inventoryItems[0] || null;

  // Compute total bonuses from all equipped items
  const totalBonus = inventoryItems
    .filter((x) => x.equipped)
    .reduce(
      (acc, it) => {
        acc.hp += it.hpBoost;
        acc.atk += it.atkBoost;
        acc.def += it.defBoost;
        acc.spd += it.spdBoost;
        return acc;
      },
      { hp: 0, atk: 0, def: 0, spd: 0 }
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none font-sans">
      <div className="relative w-full max-w-3xl bg-slate-950/95 border border-slate-700/80 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎒</span>
            <div>
              <h2 className="text-base font-black tracking-wide text-white uppercase flex items-center gap-2">
                Hành Trang & Trang Bị
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {playerName} (Lv.{playerLevel} {playerClassName})
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Nhặt đồ từ Quái vật & Boss rơi trên mặt đất 3D
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-sm font-black">
              <span>🪙</span>
              <span>{playerGold.toLocaleString()} Vàng</span>
            </div>

            <button
              onClick={closeActiveModal}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-red-950 hover:text-red-300 border border-slate-700 text-slate-400 transition cursor-pointer"
              title="Đóng (Esc / I)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Modal Body: 2 Columns (Left: Inventory Grid, Right: Details & Stats) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 flex-1 overflow-hidden">
          
          {/* Column 1 & 2: Items Inventory Grid */}
          <div className="md:col-span-2 p-5 border-r border-slate-800 overflow-y-auto custom-scrollbar max-h-[60vh] space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-2">
              <span>Danh Sách Vật Phẩm ({inventoryItems.length} Món)</span>
              <span>Bấm vào ô để chọn & mặc đồ</span>
            </div>

            {inventoryItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
                <span className="text-4xl mb-2">📦</span>
                <p className="text-sm">Túi đồ đang trống!</p>
                <p className="text-xs mt-1 text-slate-600">Hãy ra ngoài đánh Quái hoặc săn Boss để nhặt trang bị rơi!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {inventoryItems.map((it) => {
                  const isSelected = currentSelection?.id === it.id;
                  return (
                    <div
                      key={it.id}
                      onClick={() => setSelectedItem(it)}
                      className={`relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-28 ${
                        isSelected
                          ? "bg-slate-800/90 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-102"
                          : "bg-slate-900/60 hover:bg-slate-800/60 border-slate-800"
                      }`}
                    >
                      {/* Equipped Status Badge */}
                      {it.equipped && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> MẶC
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="text-2xl drop-shadow">{it.icon}</span>
                        <div className="min-w-0 flex-1">
                          <h4
                            className="text-xs font-black truncate"
                            style={{ color: it.color || "#e2e8f0" }}
                          >
                            {it.name}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {it.rarity}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono font-bold mt-2 pt-1 border-t border-slate-800/80">
                        {it.atkBoost > 0 && <span className="text-red-400">+{it.atkBoost} ATK</span>}
                        {it.hpBoost > 0 && <span className="text-emerald-400">+{it.hpBoost} HP</span>}
                        {it.defBoost > 0 && <span className="text-blue-400">+{it.defBoost} DEF</span>}
                        {it.spdBoost > 0 && <span className="text-cyan-400">+{it.spdBoost} SPD</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 3: Selected Item Details & Player Stat Summary */}
          <div className="p-5 flex flex-col justify-between bg-slate-900/30 overflow-y-auto custom-scrollbar">
            {currentSelection ? (
              <div className="space-y-4">
                {/* Item Card */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center relative overflow-hidden">
                  <div
                    className="w-16 h-16 mx-auto mb-2 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/10"
                    style={{ backgroundColor: `${currentSelection.color}20` }}
                  >
                    {currentSelection.icon}
                  </div>

                  <h3
                    className="text-sm font-black"
                    style={{ color: currentSelection.color }}
                  >
                    {currentSelection.name}
                  </h3>

                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase">
                      {currentSelection.rarity}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Loại: {currentSelection.type}
                    </span>
                  </div>

                  {/* Stat Boosts */}
                  <div className="mt-3 pt-3 border-t border-slate-800 text-left space-y-1 text-xs">
                    {currentSelection.atkBoost > 0 && (
                      <div className="flex items-center justify-between text-red-400 font-bold">
                        <span>⚔️ Tấn Công:</span>
                        <span className="font-mono">+{currentSelection.atkBoost}</span>
                      </div>
                    )}
                    {currentSelection.hpBoost > 0 && (
                      <div className="flex items-center justify-between text-emerald-400 font-bold">
                        <span>❤️ Máu Tối Đa:</span>
                        <span className="font-mono">+{currentSelection.hpBoost}</span>
                      </div>
                    )}
                    {currentSelection.defBoost > 0 && (
                      <div className="flex items-center justify-between text-blue-400 font-bold">
                        <span>🛡️ Giáp / Phòng Thủ:</span>
                        <span className="font-mono">+{currentSelection.defBoost}</span>
                      </div>
                    )}
                    {currentSelection.spdBoost > 0 && (
                      <div className="flex items-center justify-between text-cyan-400 font-bold">
                        <span>💨 Tốc Độ Chạy:</span>
                        <span className="font-mono">+{currentSelection.spdBoost}</span>
                      </div>
                    )}
                  </div>

                  {/* Equip / Unequip Action Button */}
                  <button
                    onClick={() => equipItem(currentSelection.id)}
                    className={`w-full mt-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      currentSelection.equipped
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600"
                        : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                    }`}
                  >
                    {currentSelection.equipped ? (
                      <>✕ Tháo Món Này Ra</>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Mặc Vào Người
                      </>
                    )}
                  </button>
                </div>

                {/* Player Current Combined Stats */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
                  <h5 className="font-black text-slate-300 text-[11px] uppercase tracking-wide flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Tổng Chỉ Số Nhân Vật
                  </h5>

                  <div className="flex items-center justify-between text-slate-300 font-medium">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Heart className="w-3.5 h-3.5" /> HP Tối Đa:
                    </span>
                    <span className="font-mono font-bold text-white">
                      {playerHealth} / {playerMaxHealth}
                      {totalBonus.hp > 0 && <span className="text-emerald-400 ml-1">(+{totalBonus.hp})</span>}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300 font-medium">
                    <span className="flex items-center gap-1 text-red-400">
                      <Sword className="w-3.5 h-3.5" /> Tấn Công:
                    </span>
                    <span className="font-mono font-bold text-white">
                      60 {totalBonus.atk > 0 && <span className="text-red-400">(+{totalBonus.atk})</span>}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300 font-medium">
                    <span className="flex items-center gap-1 text-blue-400">
                      <Shield className="w-3.5 h-3.5" /> Phòng Thủ:
                    </span>
                    <span className="font-mono font-bold text-white">
                      20 {totalBonus.def > 0 && <span className="text-blue-400">(+{totalBonus.def})</span>}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-slate-500 py-12">
                Chưa chọn món đồ nào
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
