import { memo, useState, useEffect } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { Skull, Shield, X, Flame } from "lucide-react";

export const TargetHealthBar = memo(function TargetHealthBar() {
  const nearbyTargetEnemies = useGameWorldStore((s) => s.nearbyTargetEnemies);
  const autoCombatTargetMonsterId = useGameWorldStore((s) => s.autoCombatTargetMonsterId);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [delayedHpPct, setDelayedHpPct] = useState(1);

  // Pick target: manual selected, or auto-combat target, or closest enemy within 18m
  const activeEnemy = nearbyTargetEnemies.find((e) => selectedId !== null ? e.id === selectedId : true);

  const hp = activeEnemy ? Math.max(0, activeEnemy.hp) : 0;
  const maxHp = activeEnemy ? Math.max(1, activeEnemy.maxHp) : 100;
  const hpPct = Math.max(0, Math.min(1, hp / maxHp));

  useEffect(() => {
    const timer = setTimeout(() => {
      setDelayedHpPct(hpPct);
    }, 280);
    return () => clearTimeout(timer);
  }, [hpPct]);

  if (!activeEnemy || activeEnemy.dist > 22 || hp <= 0) {
    return null;
  }

  const isBoss = activeEnemy.name.includes("Boss") || activeEnemy.name.includes("Long Vương") || maxHp >= 3000;
  const enemyLevel = isBoss ? 15 : activeEnemy.name.includes("Tinh Anh") ? 8 : 4;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none animate-in fade-in slide-in-from-top-3 duration-200">
      <div className="w-[340px] sm:w-[440px] p-2.5 rounded-2xl bg-gradient-to-b from-[#160608]/95 via-[#0e0405]/95 to-[#050203]/95 border-2 border-rose-500/70 shadow-[0_10px_35px_rgba(225,29,72,0.4)] backdrop-blur-md">
        
        {/* Top row: Level, Skull/Crown, Name, Distance & Dismiss */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            {/* Level badge */}
            <span className="px-1.5 py-0.5 rounded-md bg-rose-950 border border-rose-500/60 font-mono font-black text-[10px] text-rose-300 shadow shrink-0">
              Lv.{enemyLevel}
            </span>

            {/* Icon */}
            <span className="text-base shrink-0">
              {isBoss ? "🐲" : "👹"}
            </span>

            {/* Target name */}
            <h3 className="text-xs sm:text-sm font-black text-white truncate drop-shadow">
              {activeEnemy.name}
              {isBoss && <span className="ml-1 text-[10px] text-amber-400 font-bold">(Boss Thế Giới)</span>}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-mono text-slate-400">
              {activeEnemy.dist.toFixed(1)}m
            </span>
            <button
              onClick={() => setSelectedId(-999)}
              className="w-5 h-5 rounded-full bg-slate-800/80 hover:bg-rose-500 hover:text-white text-slate-400 flex items-center justify-center transition cursor-pointer text-xs"
              title="Bỏ chọn mục tiêu"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* HP Bar Container with Beveled Armor Glass Tube */}
        <div className="relative w-full h-5 rounded-xl bg-slate-950 border-2 border-rose-600/80 overflow-hidden shadow-inner p-0.5">
          {/* White delayed damage fill */}
          <div
            className="absolute inset-y-0 left-0 bg-white/70 transition-all duration-500 ease-out"
            style={{ width: `${delayedHpPct * 100}%` }}
          />

          {/* Main Red Blood Fill */}
          <div
            className="h-full rounded-lg transition-all duration-150 relative z-10"
            style={{
              width: `${hpPct * 100}%`,
              background: isBoss
                ? "linear-gradient(90deg, #881337 0%, #be123c 40%, #f43f5e 80%, #fda4af 100%)"
                : "linear-gradient(90deg, #7f1d1d 0%, #b91c1c 40%, #ef4444 80%, #fca5a5 100%)",
              boxShadow: "inset 0 1px 2px rgba(255,255,255,0.4), 0 0 15px rgba(244,63,94,0.7)",
            }}
          />

          {/* Numeric HP digits overlay */}
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] z-20">
            {Math.round(hp).toLocaleString()} / {Math.round(maxHp).toLocaleString()} ({Math.round(hpPct * 100)}%)
          </div>

          {/* Glass Sheen */}
          <div className="absolute top-0 inset-x-0 h-1 bg-white/30 rounded-t-full pointer-events-none z-30" />
        </div>

        {/* Debuff & Status Icons Row */}
        <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto text-[9px] font-mono">
          <span className="px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 flex items-center gap-0.5">
            <span>🐌</span> Chậm (-30%)
          </span>
          <span className="px-1.5 py-0.2 rounded bg-red-950/80 border border-red-500/50 text-red-300 flex items-center gap-0.5">
            <span>🩸</span> Chảy Máu
          </span>
          <span className="px-1.5 py-0.2 rounded bg-orange-950/80 border border-orange-500/50 text-orange-300 flex items-center gap-0.5">
            <span>🔥</span> Thiêu Đốt
          </span>
        </div>

      </div>
    </div>
  );
});
