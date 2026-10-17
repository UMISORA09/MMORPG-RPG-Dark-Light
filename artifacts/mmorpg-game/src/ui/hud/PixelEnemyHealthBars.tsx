// ==============================================================================
// PixelEnemyHealthBars.tsx
// Smart Target Health Bars (Bottom-Right Corner)
// Rules:
// 1. DO NOT show when in SAFE_VILLAGE or when enemy > 14m without combat.
// 2. Slide-in from right when target is active, aggro (< 12m), or damaged (hp < maxHp).
// 3. Quick [✕] dismiss button to hide an individual enemy bar.
// ==============================================================================

import { memo, useState } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { X } from "lucide-react";

export const PixelEnemyHealthBars = memo(function PixelEnemyHealthBars() {
  const nearbyEnemies = useGameWorldStore((s) => s.nearbyTargetEnemies);
  const currentZone = useGameWorldStore((s) => s.currentZone);
  const [dismissedIds, setDismissedIds] = useState<Record<string, boolean>>({});

  // 1. Do NOT display target bars when safe in village
  if (currentZone === "SAFE_VILLAGE") return null;

  if (!nearbyEnemies || nearbyEnemies.length === 0) return null;

  // 2. Filter: Only enemies within 12m or in active combat (damaged / aggro) and not dismissed
  const activeEnemies = nearbyEnemies.filter(
    (e) => !dismissedIds[e.id] && (e.dist <= 12 || e.hp < e.maxHp)
  );

  if (activeEnemies.length === 0) return null;

  return (
    <div
      className="pointer-events-auto flex flex-col gap-2 items-end select-none font-sans z-20"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {activeEnemies.map((enemy) => {
        const hpPct = Math.max(0, Math.min(1, enemy.hp / Math.max(1, enemy.maxHp)));
        const cleanName = enemy.name.toUpperCase();

        return (
          <div
            key={enemy.id}
            className="flex flex-col items-end gap-1 bg-[#0a0514]/90 backdrop-blur-md p-2 rounded-xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.85)] min-w-[210px] animate-in slide-in-from-right-4 duration-300"
          >
            {/* Header: Uppercase Enemy Name + Distance + Quick Dismiss [✕] */}
            <div className="flex items-center justify-between w-full text-xs font-black tracking-wider">
              <span className="text-rose-400 font-mono flex items-center gap-1 drop-shadow">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>{cleanName}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] text-slate-400">
                  {Math.round(enemy.dist)}m
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDismissedIds((prev) => ({ ...prev, [enemy.id]: true }));
                  }}
                  className="w-4 h-4 rounded-full bg-slate-800 hover:bg-red-900 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                  title="Đóng thanh máu này"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            {/* Elongated Red Health Bar with Sharp Black & White Border */}
            <div className="w-full bg-[#160b18] rounded-full h-4 p-[1.5px] border-2 border-white shadow-[0_2px_8px_rgba(0,0,0,0.9)] overflow-hidden relative">
              <div className="w-full h-full rounded-full overflow-hidden relative bg-[#260e16]">
                {/* Main Red Gradient Fill */}
                <div
                  className="h-full transition-all duration-200"
                  style={{
                    width: `${hpPct * 100}%`,
                    background: "linear-gradient(180deg, #ff6b6b 0%, #e6192e 55%, #880816 100%)",
                    boxShadow: "0 0 10px rgba(230, 25, 46, 0.7)",
                  }}
                />
                {/* Numeric HP readout */}
                <span className="font-mono absolute inset-0 flex items-center justify-center text-[9px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                  {enemy.hp} / {enemy.maxHp}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
