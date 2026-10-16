// ==============================================================================
// PixelEnemyHealthBars.tsx
// Bottom-Right Active Target Enemy HP Bars (Pixel Art RPG Standard)
// Features: Uppercase monster name tag (e.g. "SLIME"), crisp double-bordered
// elongated red HP bar with white highlight sheen and current/max HP text
// ==============================================================================

import { memo } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";

export const PixelEnemyHealthBars = memo(function PixelEnemyHealthBars() {
  const nearbyEnemies = useGameWorldStore((s) => s.nearbyTargetEnemies);

  if (!nearbyEnemies || nearbyEnemies.length === 0) return null;

  return (
    <div
      className="pointer-events-auto flex flex-col gap-2 items-end select-none font-sans"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {nearbyEnemies.map((enemy) => {
        const hpPct = Math.max(0, Math.min(1, enemy.hp / Math.max(1, enemy.maxHp)));
        // Extract clean uppercase name, e.g. "SLIME ĐỎ" -> "SLIME"
        const cleanName = enemy.name.toUpperCase();

        return (
          <div
            key={enemy.id}
            className="flex flex-col items-end gap-1 bg-[#0a0514]/90 backdrop-blur-md p-2 rounded-xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.85)] min-w-[200px]"
          >
            {/* Header: Uppercase Enemy Name + Distance */}
            <div className="flex items-center justify-between w-full text-xs font-black tracking-wider">
              <span className="text-rose-400 font-mono flex items-center gap-1 drop-shadow">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>{cleanName}</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                {Math.round(enemy.dist)}m
              </span>
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
