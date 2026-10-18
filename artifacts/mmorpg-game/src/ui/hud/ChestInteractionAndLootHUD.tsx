// ==============================================================================
// Giao Diện Tiếp Cận & Mở Rương Báu (Dark Fantasy Chest HUD & Loot Modal)
// Chiến Long Bá MMORPG — Proximity Prompt [F] + Parabolic Loot Reveal Dialog
// ==============================================================================

import { memo, useEffect } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { playButtonClick } from "@/audio/CombatSoundSynth";
import { X, Sparkles, PackageCheck } from "lucide-react";

export const ChestInteractionAndLootHUD = memo(function ChestInteractionAndLootHUD() {
  const nearbyChest = useGameWorldStore((s) => s.nearbyTreasureChest);
  const openedChestLoot = useGameWorldStore((s) => s.openedChestLoot);
  const openTreasureChestById = useGameWorldStore((s) => s.openTreasureChestById);
  const claimAllOpenedChestLoot = useGameWorldStore((s) => s.claimAllOpenedChestLoot);
  const pickUpLoot = useGameWorldStore((s) => s.pickUpLoot);
  const setOpenedChestLoot = useGameWorldStore((s) => s.setOpenedChestLoot);
  const playerLevel = useGameWorldStore((s) => s.playerLevel);

  // Keyboard shortcut listener: [F] to open nearby chest, [ESC] to close loot dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.code === "KeyF" && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (nearbyChest && !nearbyChest.isOpened) {
          e.preventDefault();
          playButtonClick();
          openTreasureChestById(nearbyChest.id);
        }
      } else if (e.code === "Escape") {
        if (openedChestLoot) {
          e.preventDefault();
          playButtonClick();
          setOpenedChestLoot(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nearbyChest, openedChestLoot, openTreasureChestById, setOpenedChestLoot]);

  return (
    <>
      {/* ── 1. GIAO DIỆN TIẾP CẬN RƯƠNG (FLOATING HUD PROMPT KHI ĐẾN GẦN RƯƠNG) ── */}
      {nearbyChest && !nearbyChest.isOpened && !openedChestLoot && (
        <div className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-35 pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200 select-none">
          <div
            className="flex items-center gap-3.5 px-4 sm:px-5 py-2.5 rounded-2xl bg-[#090d16]/95 border-2 shadow-[0_8px_32px_rgba(0,0,0,0.85)] backdrop-blur-xl"
            style={{
              borderColor: `${nearbyChest.beamColor}aa`,
              boxShadow: `0 0 25px ${nearbyChest.beamColor}33, 0 8px 32px rgba(0,0,0,0.9)`,
            }}
          >
            {/* Animated Glowing Chest Icon */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl border relative shrink-0 shadow-inner"
              style={{
                backgroundColor: `${nearbyChest.beamColor}20`,
                borderColor: nearbyChest.beamColor,
              }}
            >
              <span>{nearbyChest.tier === "MIRACLE_CHEST" ? "💖" : nearbyChest.tier === "GOLDEN" ? "👑" : "🎁"}</span>
              <span
                className="absolute inset-0 rounded-xl animate-ping opacity-30 pointer-events-none"
                style={{ backgroundColor: nearbyChest.beamColor }}
              />
            </div>

            {/* Chest Details */}
            <div className="flex flex-col min-w-0 pr-1">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs sm:text-sm font-black uppercase tracking-wider truncate"
                  style={{ color: nearbyChest.beamColor }}
                >
                  {nearbyChest.tierName}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/60 text-amber-300 border border-amber-500/40 shrink-0 font-bold">
                  ✨ {nearbyChest.itemCount} Bảo Vật
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                Rơi trang bị, linh thạch & đan dược tương ứng <span className="text-cyan-300 font-bold font-mono">Lv.{playerLevel}</span>
              </p>
            </div>

            {/* Open Chest Button */}
            <button
              onClick={() => {
                playButtonClick();
                openTreasureChestById(nearbyChest.id);
              }}
              className="ml-1 sm:ml-2 px-4 py-2 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider text-black transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2 cursor-pointer shrink-0"
              style={{
                background: `linear-gradient(135deg, ${nearbyChest.beamColor}, #ffffff)`,
              }}
            >
              <kbd className="px-1.5 py-0.5 rounded bg-black/40 text-white font-mono text-[10px] border border-black/30">
                F
              </kbd>
              <span>Mở Rương</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 2. GIAO DIỆN MỞ RƯƠNG (CHEST OPENING LOOT MODAL) ── */}
      {openedChestLoot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md pointer-events-auto animate-in fade-in duration-200 select-none">
          <div
            className="relative flex flex-col w-full max-w-2xl max-h-[85vh] bg-[#0b0e14]/98 border-2 rounded-[24px] shadow-[0_12px_45px_rgba(0,0,0,0.95)] overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200"
            style={{
              borderColor: `${openedChestLoot.chest.beamColor}bb`,
              boxShadow: `0 0 35px ${openedChestLoot.chest.beamColor}35, 0 12px 45px rgba(0,0,0,0.95)`,
            }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b bg-slate-900/80"
              style={{ borderColor: `${openedChestLoot.chest.beamColor}44` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl border"
                  style={{
                    backgroundColor: `${openedChestLoot.chest.beamColor}25`,
                    borderColor: openedChestLoot.chest.beamColor,
                  }}
                >
                  {openedChestLoot.chest.tier === "MIRACLE_CHEST" ? "💖" : "🎁"}
                </div>
                <div>
                  <h2
                    className="text-base sm:text-lg font-black tracking-wide flex items-center gap-2 uppercase"
                    style={{ color: openedChestLoot.chest.beamColor }}
                  >
                    <span>MỞ THÀNH CÔNG: {openedChestLoot.chest.tierName}</span>
                  </h2>
                  <p className="text-xs text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Thu hoạch được {openedChestLoot.drops.length} bảo vật cấp độ <strong className="text-cyan-300 font-mono">Lv.{openedChestLoot.level}</strong></span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  playButtonClick();
                  setOpenedChestLoot(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-red-500 hover:text-white border border-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
                title="Đóng (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Loot Items Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {openedChestLoot.drops.map((item, idx) => {
                  const borderCol = item.color || "#38bdf8";
                  return (
                    <div
                      key={item.id || `drop-${idx}`}
                      onClick={() => {
                        playButtonClick();
                        pickUpLoot(item);
                        const remaining = openedChestLoot.drops.filter((d) => d.id !== item.id);
                        if (remaining.length === 0) {
                          setOpenedChestLoot(null);
                        } else {
                          setOpenedChestLoot({ ...openedChestLoot, drops: remaining });
                        }
                      }}
                      className="group flex items-center gap-3 p-3 rounded-2xl bg-slate-900/70 border transition hover:bg-slate-800/90 hover:scale-[1.02] cursor-pointer active:scale-95 shadow-md"
                      style={{ borderColor: `${borderCol}66` }}
                      title="Nhấn để nhặt món đồ này vào hành trang"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border shrink-0 shadow-inner group-hover:scale-110 transition-transform"
                        style={{
                          backgroundColor: `${borderCol}18`,
                          borderColor: borderCol,
                        }}
                      >
                        {item.icon || "📦"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p
                            className="text-xs sm:text-sm font-extrabold truncate"
                            style={{ color: borderCol }}
                          >
                            {item.name}
                          </p>
                          <span className="text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                            + Nhặt
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 truncate font-mono mt-0.5">
                          {item.statText || (item.value ? `+${item.value}` : "Vật phẩm rương")}
                        </p>
                        <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.2 rounded bg-black/60 border border-slate-800 text-slate-400">
                          {item.rarity || "Thường"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer: Action Buttons */}
            <div
              className="px-5 py-3.5 border-t bg-slate-900/60 flex items-center justify-between gap-3"
              style={{ borderColor: `${openedChestLoot.chest.beamColor}33` }}
            >
              <span className="text-xs text-slate-400 hidden sm:inline">
                Nhấn <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono">ESC</kbd> để đóng
              </span>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    playButtonClick();
                    setOpenedChestLoot(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
                >
                  Đóng
                </button>

                <button
                  onClick={() => {
                    playButtonClick();
                    claimAllOpenedChestLoot();
                  }}
                  className="flex-1 sm:flex-none px-5 py-2 rounded-xl font-black text-xs sm:text-sm text-black transition transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${openedChestLoot.chest.beamColor}, #ffffff)`,
                  }}
                >
                  <PackageCheck className="w-4 h-4 text-black" />
                  <span>Thu Thập Tất Cả Vào Hành Trang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

