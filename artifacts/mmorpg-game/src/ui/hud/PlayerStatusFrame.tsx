// ==============================================================================
// Dark-Light RPG HUD — Player Status Frame
// Beveled bronze/obsidian frame, delayed damage health bar, diamond level badge,
// glowing cyan EXP track, real-time gold & class passive stacks
// ==============================================================================

import { memo, useState, useEffect } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { getCharacterBlueprint } from "@/skills";
import { Heart, Shield, Swords, Zap, Coins } from "lucide-react";

export const PlayerStatusFrame = memo(function PlayerStatusFrame() {
  const playerName = useGameWorldStore((s) => s.playerName);
  const playerClassName = useGameWorldStore((s) => s.playerClassName);
  const playerClassId = useGameWorldStore((s) => s.playerClassId);
  const playerColorHex = useGameWorldStore((s) => s.playerColorHex);
  const playerLevel = useGameWorldStore((s) => s.playerLevel);
  const playerHealth = useGameWorldStore((s) => s.playerHealth);
  const playerMaxHealth = useGameWorldStore((s) => s.playerMaxHealth);
  const playerExp = useGameWorldStore((s) => s.playerExp);
  const playerExpToNext = useGameWorldStore((s) => s.playerExpToNext);
  const playerGold = useGameWorldStore((s) => s.playerGold);
  const playerKills = useGameWorldStore((s) => s.playerKills);

  const passiveCounter = useGameWorldStore((s) => s.passiveCounter);
  const passiveActive = useGameWorldStore((s) => s.passiveActive);
  const passiveFuryPercent = useGameWorldStore((s) => s.passiveFuryPercent);

  const blueprint = getCharacterBlueprint(playerClassId);

  // Compute percentages
  const hpPct = Math.max(0, Math.min(1, playerHealth / Math.max(1, playerMaxHealth)));
  const expPct = playerExpToNext > 0 ? Math.min(100, (playerExp / playerExpToNext) * 100) : 0;

  // Delayed white/red damage bar
  const [delayedHpPct, setDelayedHpPct] = useState(hpPct);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDelayedHpPct(hpPct);
    }, 400);
    return () => clearTimeout(timer);
  }, [hpPct]);

  return (
    <div
      className="pointer-events-auto flex flex-col gap-1.5 select-none"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Main Frame: Beveled Obsidian & Bronze Card ── */}
      <div
        className="relative bg-[#0d071a]/90 backdrop-blur-md border border-amber-500/40 rounded-2xl p-3 shadow-[0_12px_40px_rgba(0,0,0,0.85)] min-w-[300px] max-w-sm flex items-center gap-3 transition-all"
        style={{
          boxShadow: `0 0 25px ${playerColorHex}25, 0 10px 30px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Diamond Level Badge + Avatar */}
        <div className="relative shrink-0">
          {/* Avatar Container */}
          <div
            className="w-13 h-13 rounded-xl flex items-center justify-center font-black text-2xl text-white shadow-inner border border-amber-400/50"
            style={{
              backgroundColor: `${playerColorHex}30`,
              boxShadow: `inset 0 0 14px ${playerColorHex}80`,
            }}
          >
            {playerClassId === "gunner"
              ? "🎯"
              : playerClassId === "assassin"
              ? "🗡️"
              : playerClassId === "fighter"
              ? "🥊"
              : "🛡️"}
          </div>

          {/* Diamond Rhombus Level Badge */}
          <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-[#0a0514] border border-amber-400 rounded-sm rotate-45 flex items-center justify-center shadow-md">
            <span className="-rotate-45 font-mono text-[9px] font-black text-amber-300">
              {playerLevel}
            </span>
          </div>
        </div>

        {/* Details & Bars */}
        <div className="flex-1 min-w-0">
          {/* Name & Class Title */}
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="font-sans font-black text-xs sm:text-sm text-slate-100 truncate tracking-wide drop-shadow">
              {playerName}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded border border-cyan-400/40 bg-cyan-950/40 text-cyan-300 font-mono">
              {playerClassName}
            </span>
          </div>

          {/* HP Bar with White Delayed Damage Bar */}
          <div className="w-full bg-[#181024] rounded-full h-3.5 border border-slate-700/80 overflow-hidden relative mb-1.5">
            {/* White Delayed Damage Bar */}
            <div
              className="absolute inset-y-0 left-0 bg-white/70 transition-all duration-500 ease-out"
              style={{ width: `${delayedHpPct * 100}%` }}
            />
            {/* Vibrant Main HP Fill */}
            <div
              className="absolute inset-y-0 left-0 transition-all duration-200"
              style={{
                width: `${hpPct * 100}%`,
                background:
                  hpPct > 0.5
                    ? "linear-gradient(90deg, #dc2626, #f97316)"
                    : hpPct > 0.25
                    ? "linear-gradient(90deg, #ea580c, #fbbf24)"
                    : "linear-gradient(90deg, #991b1b, #ef4444)",
                boxShadow: "0 0 10px rgba(239, 68, 68, 0.5)",
              }}
            />
            {/* HP Text */}
            <span className="font-mono absolute inset-0 flex items-center justify-center text-[9px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              {playerHealth} / {playerMaxHealth} HP
            </span>
          </div>

          {/* EXP Bar (Cyan Neon) */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 gap-1.5 mb-1">
            <div className="flex-1 bg-[#120a1f] rounded-full h-1.5 border border-cyan-500/30 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-300 shadow-[0_0_8px_#00f2ff]"
                style={{ width: `${expPct}%` }}
              />
            </div>
            <span className="font-mono text-[9px] font-bold text-cyan-300">
              {Math.floor(expPct)}%
            </span>
          </div>

          {/* Gold & Kills Counter */}
          <div className="font-mono flex items-center justify-between text-[11px] font-bold pt-0.5">
            <span className="text-amber-300 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{playerGold.toLocaleString()} Vàng</span>
            </span>
            <span className="text-rose-400 flex items-center gap-1 text-[10px]">
              <Swords className="w-3 h-3" />
              <span>{playerKills} Quái</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Class Passive Mini-Tracker ── */}
      <div
        className="bg-[#0d071a]/85 backdrop-blur-md border border-slate-800/90 rounded-xl px-2.5 py-1.5 shadow-md flex items-center justify-between gap-2 text-xs min-w-[300px]"
      >
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-sm">{blueprint.passive.icon}</span>
          <span className="font-bold text-slate-300 text-[10px] truncate">
            {blueprint.passive.name.split(" (")[0]}
          </span>
        </div>

        {/* Class Specific Displays */}
        {playerClassId === "gunner" && (
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3].map((step) => {
              const isFilled = passiveCounter > step || (passiveActive && step === 3);
              return (
                <div
                  key={step}
                  className={`w-2.5 h-2.5 rounded-full border transition-all ${
                    isFilled
                      ? step === 3
                        ? "bg-red-500 border-red-300 shadow-[0_0_8px_#ef4444]"
                        : "bg-cyan-400 border-cyan-200 shadow-[0_0_6px_#00f2ff]"
                      : "bg-slate-900 border-slate-700"
                  }`}
                  title={step === 3 ? "Phát 4: CHÍ MẠNG 200%" : `Đạn nạp ${step + 1}`}
                />
              );
            })}
          </div>
        )}

        {playerClassId === "fighter" && (
          <div className="flex items-center gap-1.5">
            <div className="w-14 bg-slate-950 rounded-full h-1.5 border border-orange-500/50 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all"
                style={{ width: `${passiveFuryPercent}%` }}
              />
            </div>
            <span className="text-[9px] font-mono font-bold text-orange-400">
              +{Math.round(passiveFuryPercent * 0.6)}% ATK
            </span>
          </div>
        )}

        {playerClassId === "assassin" && (
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
            +50% DMG Lướt/Lưng
          </span>
        )}

        {playerClassId === "tank" && (
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
            -30% DMG Phản Kích
          </span>
        )}
      </div>
    </div>
  );
});
