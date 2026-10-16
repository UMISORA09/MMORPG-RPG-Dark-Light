// ==============================================================================
// Dark-Light RPG HUD — Player Status Frame (Top-Left)
// Pixel Art Hero Portrait, Crisp Double-Bordered HP (Red-Orange) & PP (Bright Blue) Bars
// ==============================================================================

import { memo, useState, useEffect } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { getCharacterBlueprint } from "@/skills";
import { PixelAvatarPortrait } from "./PixelAvatarPortrait";
import { Swords, Coins } from "lucide-react";

export const PlayerStatusFrame = memo(function PlayerStatusFrame() {
  const playerName = useGameWorldStore((s) => s.playerName);
  const playerClassName = useGameWorldStore((s) => s.playerClassName);
  const playerClassId = useGameWorldStore((s) => s.playerClassId);
  const playerColorHex = useGameWorldStore((s) => s.playerColorHex);
  const playerLevel = useGameWorldStore((s) => s.playerLevel);
  const playerHealth = useGameWorldStore((s) => s.playerHealth);
  const playerMaxHealth = useGameWorldStore((s) => s.playerMaxHealth);
  const playerPp = useGameWorldStore((s) => s.playerPp);
  const playerMaxPp = useGameWorldStore((s) => s.playerMaxPp);
  const playerExp = useGameWorldStore((s) => s.playerExp);
  const playerExpToNext = useGameWorldStore((s) => s.playerExpToNext);
  const playerGold = useGameWorldStore((s) => s.playerGold);
  const playerKills = useGameWorldStore((s) => s.playerKills);

  const passiveCounter = useGameWorldStore((s) => s.passiveCounter);
  const passiveActive = useGameWorldStore((s) => s.passiveActive);
  const passiveFuryPercent = useGameWorldStore((s) => s.passiveFuryPercent);
  const playerDebuffs = useGameWorldStore((s) => s.playerDebuffs);

  const blueprint = getCharacterBlueprint(playerClassId);

  // Compute percentages
  const hpPct = Math.max(0, Math.min(1, playerHealth / Math.max(1, playerMaxHealth)));
  const ppPct = Math.max(0, Math.min(1, playerPp / Math.max(1, playerMaxPp)));
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
      className="pointer-events-auto flex flex-col gap-1.5 select-none font-sans"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Main Frame: Double-Bordered Dark Fantasy Card ── */}
      <div
        className="relative bg-[#0d071a]/95 backdrop-blur-md border-2 border-white/80 rounded-2xl p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.85)] min-w-[320px] max-w-sm flex items-center gap-3 transition-all"
        style={{
          boxShadow: `0 0 20px ${playerColorHex}30, 0 8px 30px rgba(0,0,0,0.9)`,
        }}
      >
        {/* Diamond Level Badge + Pixel Avatar Portrait */}
        <div className="relative shrink-0">
          <PixelAvatarPortrait
            classId={playerClassId}
            classNameTitle={playerClassName}
            colorHex={playerColorHex}
            size={56}
          />

          {/* Level Badge at bottom-right corner */}
          <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-[#0a0514] border-2 border-amber-400 rounded-sm rotate-45 flex items-center justify-center shadow-md">
            <span className="-rotate-45 font-mono text-[10px] font-black text-amber-300">
              {playerLevel}
            </span>
          </div>
        </div>

        {/* Details & Bars */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Name & Class Title */}
          <div className="flex items-center justify-between gap-1">
            <span className="font-sans font-black text-xs sm:text-sm text-slate-100 truncate tracking-wide drop-shadow">
              {playerName}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded border border-cyan-400/50 bg-cyan-950/60 text-cyan-300 font-mono">
              {playerClassName}
            </span>
          </div>

          {/* ── HP BAR: Đỏ cam (#d94c3d) bo tròn, viền đen & trắng sắc nét ── */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black font-mono text-rose-400 tracking-wider w-5 shrink-0">
              HP
            </span>
            <div className="flex-1 bg-[#1a0f18] rounded-full h-4 p-[1.5px] border-2 border-white/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] overflow-hidden relative">
              {/* Black inner edge */}
              <div className="w-full h-full rounded-full overflow-hidden relative bg-[#2a1018]">
                {/* Delayed Damage Bar */}
                <div
                  className="absolute inset-y-0 left-0 bg-white/70 transition-all duration-500 ease-out"
                  style={{ width: `${delayedHpPct * 100}%` }}
                />
                {/* Main Red-Orange HP Fill (#d94c3d) with highlight sheen */}
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-200"
                  style={{
                    width: `${hpPct * 100}%`,
                    background: "linear-gradient(180deg, #ff7b6b 0%, #d94c3d 60%, #991b1b 100%)",
                    boxShadow: "0 0 10px rgba(217, 76, 61, 0.6)",
                  }}
                />
                {/* Numeric Text */}
                <span className="font-mono absolute inset-0 flex items-center justify-center text-[9px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                  {playerHealth} / {playerMaxHealth}
                </span>
              </div>
            </div>
          </div>

          {/* ── PP BAR: Năng lượng xanh lam sáng (#249fde) bo tròn, viền đen & trắng ── */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black font-mono text-sky-400 tracking-wider w-5 shrink-0">
              PP
            </span>
            <div className="flex-1 bg-[#0b172a] rounded-full h-3.5 p-[1.5px] border-2 border-white/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] overflow-hidden relative">
              <div className="w-full h-full rounded-full overflow-hidden relative bg-[#091830]">
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-200"
                  style={{
                    width: `${ppPct * 100}%`,
                    background: "linear-gradient(180deg, #60c5ff 0%, #249fde 60%, #0369a1 100%)",
                    boxShadow: "0 0 8px rgba(36, 159, 222, 0.6)",
                  }}
                />
                <span className="font-mono absolute inset-0 flex items-center justify-center text-[8px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                  {playerPp} / {playerMaxPp}
                </span>
              </div>
            </div>
          </div>

          {/* ── EXP BAR: Thanh kinh nghiệm xanh ngọc / lục mỏng viền nét ── */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black font-mono text-emerald-400 tracking-wider w-5 shrink-0">
              EXP
            </span>
            <div className="flex-1 bg-[#091510] rounded-full h-2 p-[1px] border border-emerald-500/50 overflow-hidden relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${expPct}%` }}
              />
            </div>
            <span className="font-mono text-[8px] text-emerald-300 font-bold shrink-0">
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
        className="bg-[#0d071a]/90 backdrop-blur-md border border-slate-800/90 rounded-xl px-2.5 py-1.5 shadow-md flex items-center justify-between gap-2 text-xs min-w-[320px]"
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

      {/* ── Active Debuffs Badges ── */}
      {playerDebuffs && playerDebuffs.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {playerDebuffs.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-950/90 border border-red-500/70 shadow-[0_0_10px_rgba(239,68,68,0.45)] text-[10px] font-mono font-bold text-rose-200 animate-pulse"
            >
              <span>{d.icon}</span>
              <span>{d.name}</span>
              <span className="text-amber-300 font-mono">({Math.ceil(d.duration)}s)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
