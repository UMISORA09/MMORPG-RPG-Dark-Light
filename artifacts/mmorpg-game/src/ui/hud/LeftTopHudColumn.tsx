// ==============================================================================
// LeftTopHudColumn.tsx
// Smart Collapsible & Non-Overlapping Layout (Top-Left Corner)
// Architecture: Single flex-col container ensuring 0% overlapping elements:
// Tầng 1: PlayerStatusCompactCard (with [▲/▼] toggle to minimize)
// Tầng 2: PassiveStatusBadge (class passive & debuffs)
// Tầng 3: CollapsibleQuestTracker (with 3 modes: Expanded, Compact, Drawer Pill)
// ==============================================================================

import { memo, useState, useEffect } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { getCharacterBlueprint } from "@/skills";
import { PixelAvatarPortrait } from "./PixelAvatarPortrait";
import { Swords, Coins, ChevronUp, ChevronDown, Minus, ChevronLeft, ChevronRight, Scroll, Compass, CheckCircle2 } from "lucide-react";
import { playCombatSFX } from "@/audio/CombatSoundSynth";

export const LeftTopHudColumn = memo(function LeftTopHudColumn() {
  const [isPlayerCompact, setIsPlayerCompact] = useState(false);
  const [questMode, setQuestMode] = useState<"expanded" | "compact" | "drawer">("expanded");

  return (
    <div
      className="pointer-events-auto flex flex-col gap-2 items-start select-none font-sans z-30 max-w-[340px]"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── TẦNG 1: KHUNG NHÂN VẬT TINH GỌN (PlayerStatusCompactCard) ── */}
      <PlayerStatusCompactCard
        isCompact={isPlayerCompact}
        onToggleCompact={() => setIsPlayerCompact((prev) => !prev)}
      />

      {/* ── TẦNG 2: THANH NỘI TẠI HỆ PHÁI & DEBUFFS (PassiveStatusBadge) ── */}
      <PassiveStatusBadge />

      {/* ── TẦNG 3: BẢNG NHIỆM VỤ THU PHÓNG THÔNG MINH (CollapsibleQuestTracker) ── */}
      <CollapsibleQuestTracker
        mode={questMode}
        onSetMode={setQuestMode}
      />
    </div>
  );
});

// ==============================================================================
// 1. PlayerStatusCompactCard (Tầng 1)
// ==============================================================================
interface PlayerCardProps {
  isCompact: boolean;
  onToggleCompact: () => void;
}

const PlayerStatusCompactCard = memo(function PlayerStatusCompactCard({
  isCompact,
  onToggleCompact,
}: PlayerCardProps) {
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

  // Percentages
  const hpPct = Math.max(0, Math.min(1, playerHealth / Math.max(1, playerMaxHealth)));
  const ppPct = Math.max(0, Math.min(1, playerPp / Math.max(1, playerMaxPp)));
  const expPct = playerExpToNext > 0 ? Math.min(100, (playerExp / playerExpToNext) * 100) : 0;

  // Delayed damage bar
  const [delayedHpPct, setDelayedHpPct] = useState(hpPct);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDelayedHpPct(hpPct);
    }, 400);
    return () => clearTimeout(timer);
  }, [hpPct]);

  return (
    <div
      className="relative bg-[#0d071a]/95 backdrop-blur-md border-2 border-white/80 rounded-2xl p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.85)] min-w-[310px] max-w-[330px] flex flex-col gap-1.5 transition-all duration-300"
      style={{
        boxShadow: `0 0 20px ${playerColorHex}30, 0 8px 30px rgba(0,0,0,0.9)`,
      }}
    >
      {/* Header Row: Avatar + Name + Class + Toggle [▲/▼] Button */}
      <div className="flex items-center gap-2.5">
        {/* Diamond Level Badge + Pixel Avatar */}
        <div className="relative shrink-0">
          <PixelAvatarPortrait
            classId={playerClassId}
            classNameTitle={playerClassName}
            colorHex={playerColorHex}
            size={isCompact ? 38 : 52}
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0a0514] border border-amber-400 rounded-sm rotate-45 flex items-center justify-center shadow-md">
            <span className="-rotate-45 font-mono text-[9px] font-black text-amber-300">
              {playerLevel}
            </span>
          </div>
        </div>

        {/* Identity & Header Controls */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="font-sans font-black text-xs sm:text-sm text-slate-100 truncate tracking-wide drop-shadow">
              {playerName}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-cyan-400/50 bg-cyan-950/60 text-cyan-300 font-mono">
                {playerClassName}
              </span>
              {/* [▲/▼] Minimize Toggle Button */}
              <button
                onClick={onToggleCompact}
                className="w-5 h-5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/60 flex items-center justify-center transition cursor-pointer"
                title={isCompact ? "Mở rộng khung nhân vật" : "Thu gọn khung nhân vật"}
              >
                {isCompact ? <ChevronDown className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* In Compact mode: thin inline HP bar right below name */}
          {isCompact && (
            <div className="mt-1 flex items-center gap-1">
              <div className="flex-1 bg-[#1a0f18] rounded-full h-2.5 p-[1px] border border-white/70 overflow-hidden relative">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${hpPct * 100}%`,
                    background: "linear-gradient(90deg, #ff7b6b 0%, #d94c3d 60%, #991b1b 100%)",
                  }}
                />
              </div>
              <span className="font-mono text-[9px] font-bold text-rose-300">
                {playerHealth}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details: Full HP, PP, EXP, Gold & Kills (Hidden in compact mode) */}
      {!isCompact && (
        <div className="flex flex-col gap-1 pt-0.5 animate-in fade-in duration-200">
          {/* HP BAR */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black font-mono text-rose-400 tracking-wider w-5 shrink-0">
              HP
            </span>
            <div className="flex-1 bg-[#1a0f18] rounded-full h-3.5 p-[1.5px] border-2 border-white/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] overflow-hidden relative">
              <div className="w-full h-full rounded-full overflow-hidden relative bg-[#2a1018]">
                <div
                  className="absolute inset-y-0 left-0 bg-white/70 transition-all duration-500 ease-out"
                  style={{ width: `${delayedHpPct * 100}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-200"
                  style={{
                    width: `${hpPct * 100}%`,
                    background: "linear-gradient(180deg, #ff7b6b 0%, #d94c3d 60%, #991b1b 100%)",
                    boxShadow: "0 0 10px rgba(217, 76, 61, 0.6)",
                  }}
                />
                <span className="font-mono absolute inset-0 flex items-center justify-center text-[9px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                  {playerHealth} / {playerMaxHealth}
                </span>
              </div>
            </div>
          </div>

          {/* PP / MP BAR */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black font-mono text-sky-400 tracking-wider w-5 shrink-0">
              PP
            </span>
            <div className="flex-1 bg-[#0b172a] rounded-full h-3 p-[1.5px] border-2 border-white/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] overflow-hidden relative">
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

          {/* EXP BAR */}
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] font-black font-mono text-emerald-400 tracking-wider w-5 shrink-0">
              EXP
            </span>
            <div className="flex-1 bg-[#091510] rounded-full h-1.5 p-[1px] border border-emerald-500/50 overflow-hidden relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${expPct}%` }}
              />
            </div>
            <span className="font-mono text-[8px] text-emerald-300 font-bold shrink-0">
              {Math.floor(expPct)}%
            </span>
          </div>

          {/* Hàng Dưới Cùng: 🪙 VÀNG & ⚔️ SỐ QUÁI (Tuyệt đối không bị che khuất) */}
          <div className="font-mono flex items-center justify-between text-[11px] font-bold pt-1 border-t border-slate-800/80 mt-0.5">
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
      )}
    </div>
  );
});

// ==============================================================================
// 2. PassiveStatusBadge (Tầng 2)
// ==============================================================================
const PassiveStatusBadge = memo(function PassiveStatusBadge() {
  const playerClassId = useGameWorldStore((s) => s.playerClassId);
  const passiveCounter = useGameWorldStore((s) => s.passiveCounter);
  const passiveActive = useGameWorldStore((s) => s.passiveActive);
  const passiveFuryPercent = useGameWorldStore((s) => s.passiveFuryPercent);
  const playerDebuffs = useGameWorldStore((s) => s.playerDebuffs);

  const blueprint = getCharacterBlueprint(playerClassId);

  return (
    <div className="flex flex-col gap-1 w-full max-w-[330px]">
      {/* Class Passive Badge */}
      <div className="bg-[#0d071a]/90 backdrop-blur-md border border-slate-800/90 rounded-xl px-2.5 py-1.5 shadow-md flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-sm">{blueprint.passive.icon}</span>
          <span className="font-bold text-slate-300 text-[10px] truncate">
            {blueprint.passive.name.split(" (")[0]}
          </span>
        </div>

        {/* Class Specific Passive Status */}
        {playerClassId === "gunner" && (
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3].map((step) => {
              const isFilled = passiveCounter > step || (passiveActive && step === 3);
              return (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full border transition-all ${
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
            <div className="w-12 bg-slate-950 rounded-full h-1.5 border border-orange-500/50 overflow-hidden">
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
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
            +50% DMG Lướt/Lưng
          </span>
        )}

        {playerClassId === "tank" && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
            -30% DMG Phản Kích
          </span>
        )}
      </div>

      {/* Active Debuffs */}
      {playerDebuffs && playerDebuffs.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
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

// ==============================================================================
// 3. CollapsibleQuestTracker (Tầng 3)
// 3 Chế độ: Expanded (Đầy đủ), Compact (Thanh 1 dòng 32px), Drawer (Thu vào mép trái)
// ==============================================================================
interface QuestTrackerProps {
  mode: "expanded" | "compact" | "drawer";
  onSetMode: (mode: "expanded" | "compact" | "drawer") => void;
}

const CollapsibleQuestTracker = memo(function CollapsibleQuestTracker({
  mode,
  onSetMode,
}: QuestTrackerProps) {
  const trackedQuest = useGameWorldStore((s) => s.trackedQuest);
  const setTrackedQuest = useGameWorldStore((s) => s.setTrackedQuest);

  if (!trackedQuest) return null;

  const isComplete = trackedQuest.status === "READY_TO_CLAIM";

  // ── Chế độ 3: COLLAPSED DRAWER (Mấu bấm [📜] nép sát mép trái) ──
  if (mode === "drawer") {
    return (
      <button
        onClick={() => {
          playCombatSFX("holy_bell", 0.3);
          onSetMode("expanded");
        }}
        className="group -ml-3 px-3 py-1.5 rounded-r-2xl bg-slate-950/90 border-y border-r border-amber-500/60 shadow-[0_4px_16px_rgba(245,158,11,0.3)] backdrop-blur-md flex items-center gap-1.5 text-xs text-amber-300 font-bold hover:bg-slate-900 transition-all duration-300 hover:translate-x-1 cursor-pointer"
        title="Mở rộng Bảng Nhiệm Vụ"
        style={{
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <Scroll className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
        <span className="text-[11px] font-extrabold tracking-wide">Nhiệm Vụ</span>
        <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
      </button>
    );
  }

  // ── Chế độ 2: COMPACT BAR (Thanh ngang mỏng 1 dòng h-8 / 32px) ──
  if (mode === "compact") {
    return (
      <div className="h-8 max-w-[330px] w-full px-2.5 rounded-xl bg-slate-950/90 border border-amber-500/50 backdrop-blur-md shadow-md flex items-center justify-between gap-1.5 text-[11px]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Scroll className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-bold text-slate-200 truncate">
            {trackedQuest.title}:
          </span>
          <span className="font-mono font-bold text-amber-300 shrink-0">
            ({trackedQuest.progress || 0}/{trackedQuest.requiredCount || 1})
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              playCombatSFX("holy_bell", 0.3);
              setTrackedQuest(trackedQuest);
            }}
            className="p-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 transition cursor-pointer"
            title="Chỉ đường 3D"
          >
            <Compass className="w-3 h-3 text-cyan-400" />
          </button>
          <button
            onClick={() => onSetMode("expanded")}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Mở rộng chi tiết"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => onSetMode("drawer")}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Thu vào lề"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // ── Chế độ 1: EXPANDED (Bảng đầy đủ thông tin) ──
  return (
    <div className="w-full max-w-[330px] p-3 rounded-2xl bg-slate-950/90 border border-amber-500/50 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.85)] animate-in fade-in duration-200">
      {/* Header: Title + Notification Dot (in corner, separate from text) + Controls */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
          <Scroll className="w-3.5 h-3.5 text-amber-400" />
          <span>Nhiệm Vụ Chính Tuyến</span>
          {/* Notification Ping Badge strictly positioned beside title */}
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping ml-0.5" />
        </div>

        {/* Action Controls: [Chi tiết], [-] Thu nhỏ 1 dòng, [◀] Thu vào lề */}
        <div className="flex items-center gap-1 text-[10px]">
          <button
            onClick={() => {
              useGameWorldStore.getState().setActiveModal("quests");
              playCombatSFX("holy_bell", 0.3);
            }}
            className="text-slate-400 hover:text-cyan-400 transition cursor-pointer font-bold px-1"
          >
            [Chi tiết]
          </button>
          <button
            onClick={() => onSetMode("compact")}
            className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center transition cursor-pointer"
            title="Thu gọn thành 1 dòng (Compact)"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={() => onSetMode("drawer")}
            className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center transition cursor-pointer"
            title="Thu gọn sát mép trái"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Quest Title & Description */}
      <h4 className="font-extrabold text-xs text-slate-100 leading-tight">
        {trackedQuest.title}
      </h4>
      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
        {trackedQuest.description}
      </p>

      {/* Objective Progress */}
      <div className="mt-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
          )}
          <span className={`truncate ${isComplete ? "text-emerald-400 font-bold" : "text-slate-300"}`}>
            {trackedQuest.targetName}:
          </span>
        </div>
        <span className="font-mono font-bold text-amber-300 shrink-0 ml-1">
          {trackedQuest.progress || 0} / {trackedQuest.requiredCount || 1}
        </span>
      </div>

      {/* Waypoint Compass Action */}
      <div className="mt-2 flex items-center justify-between pt-1">
        <div className="text-[10px] text-slate-500">
          Khu vực: <span className="text-cyan-400 font-semibold">{trackedQuest.targetZone || "Làng Tân Thủ"}</span>
        </div>
        <button
          onClick={() => {
            playCombatSFX("holy_bell", 0.35);
            setTrackedQuest(trackedQuest);
          }}
          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer hover:scale-105 active:scale-95"
        >
          <Compass className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Chỉ Đường 3D</span>
        </button>
      </div>
    </div>
  );
});
