// ==============================================================================
// Dark-Light RPG HUD — UnifiedGameHUD (Smart Collapsible & Non-Overlapping Layout)
// Architecture:
// 1. Top-Left: LeftTopHudColumn (Compact Player Status + Passive Badge + 3-mode Quest Tracker)
// 2. Top-Center: Boss Raid Bar, Zone Notice & Weather
// 3. Top-Right: RightTopMinimapAndDrawer (Zoomable Minimap + Collapsible 12-Button System Tray)
// 4. Right-Edge: RightEdgeQuickDock (Semi-circle dock for Chat & Adventure Logs)
// 5. Bottom: SymmetricalActionHUD (Collapsible Skill Rows, Auto-fade in village, Combat combo hint)
//    + PixelEnemyHealthBars (Filtered target bars with dismiss)
// ==============================================================================

import { memo, useRef, useState, useEffect } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { LeftTopHudColumn } from "./LeftTopHudColumn";
import { RightTopMinimapAndDrawer } from "./RightTopMinimapAndDrawer";
import { RightEdgeQuickDock } from "./RightEdgeQuickDock";
import { SymmetricalActionHUD } from "./SymmetricalActionHUD";
import { PixelEnemyHealthBars } from "./PixelEnemyHealthBars";

export interface UnifiedGameHUDProps {
  onLogout?: () => void;
}

export const UnifiedGameHUD = memo(function UnifiedGameHUD({
  onLogout,
}: UnifiedGameHUDProps) {
  const currentZone = useGameWorldStore((s) => s.currentZone);
  const zoneNotification = useGameWorldStore((s) => s.zoneNotification);
  const isLevelSuppressed = useGameWorldStore((s) => s.isLevelSuppressed);
  const zoneWarningBanner = useGameWorldStore((s) => s.zoneWarningBanner);
  const weather = useGameWorldStore((s) => s.weather);
  const bossName = useGameWorldStore((s) => s.bossName);
  const bossHealth = useGameWorldStore((s) => s.bossHealth);
  const bossMaxHealth = useGameWorldStore((s) => s.bossMaxHealth);
  const bossActive = useGameWorldStore((s) => s.bossActive);
  const bossPhase = useGameWorldStore((s) => s.bossPhase);
  const bossStagger = useGameWorldStore((s) => s.bossStagger);
  const bossIsStaggered = useGameWorldStore((s) => s.bossIsStaggered);
  const bossCastingSpell = useGameWorldStore((s) => s.bossCastingSpell);
  const bossCastingTimer = useGameWorldStore((s) => s.bossCastingTimer);
  const combatKillToast = useGameWorldStore((s) => s.combatKillToast);

  const bossHpPct = Math.max(0, Math.min(1, bossHealth / Math.max(1, bossMaxHealth)));

  // Smooth Delayed Damage Bar for Boss HP
  const [delayedBossHpPct, setDelayedBossHpPct] = useState(bossHpPct);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDelayedBossHpPct(bossHpPct);
    }, 450);
    return () => clearTimeout(timer);
  }, [bossHpPct]);

  // Touch joystick handling for Mobile
  const joystickAreaRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    const rect = joystickAreaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = 45;
    const clampedDist = Math.min(dist, maxRadius);
    const nx = dist > 0 ? (dx / dist) * clampedDist : 0;
    const ny = dist > 0 ? (dy / dist) * clampedDist : 0;

    setKnobPos({ x: nx, y: ny });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    handleTouchStart(e);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    setKnobPos({ x: 0, y: 0 });
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 select-none font-sans">
      
      {/* ── TOP SECTION: LeftTopHudColumn, Boss Bar / Zone Banner (Center), RightTopMinimapAndDrawer (Right) ── */}
      <div className="flex items-start justify-between w-full">
        
        {/* Top-Left: Ergonomic Flex-Column HUD (Player Status + Passive Badge + 3-Mode Quest Tracker) */}
        <LeftTopHudColumn />

        {/* Top-Center: Zone Warning Banner, Boss Raid Health Bar & Smooth Notices */}
        <div className="flex flex-col items-center flex-1 max-w-md mx-3">
          {/* Big Dangerous Zone Warning Banner */}
          {zoneWarningBanner && (
            <div className="mb-2 w-full bg-rose-950/95 backdrop-blur-md border-2 border-rose-500 rounded-xl px-4 py-2 shadow-[0_0_30px_rgba(239,68,68,0.6)] text-center animate-bounce pointer-events-auto">
              <span className="text-xs md:text-sm font-black tracking-wide text-rose-200">
                {zoneWarningBanner}
              </span>
            </div>
          )}

          {/* Boss Raid Health Bar */}
          {bossActive && (
            <div
              className="w-full bg-[#0a0514]/90 backdrop-blur-md border border-red-500/50 rounded-2xl p-2.5 shadow-[0_0_25px_rgba(239,68,68,0.35)] animate-in fade-in duration-300 pointer-events-auto"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-serif font-black text-rose-300 flex items-center gap-1.5 drop-shadow">
                  <span>🐉</span>
                  <span className="truncate">{bossName}</span>
                  {bossPhase === 2 && (
                    <span className="px-1.5 py-0.2 rounded bg-red-600 text-white font-mono text-[9px] animate-pulse">
                      PHASE 2: CUỒNG NỘ
                    </span>
                  )}
                </span>
                <span className="font-mono text-[10px] text-amber-300 font-bold">
                  {bossHealth} / {bossMaxHealth}
                </span>
              </div>

              {/* Boss HP Bar */}
              <div className="w-full bg-[#160b1e] rounded-full h-3 border border-red-900/60 overflow-hidden relative">
                <div
                  className="h-full bg-white/70 absolute inset-0 transition-all duration-500"
                  style={{ width: `${delayedBossHpPct * 100}%` }}
                />
                <div
                  className={`h-full absolute inset-0 transition-all duration-200 ${
                    bossPhase === 2
                      ? "bg-gradient-to-r from-red-600 via-orange-500 to-amber-400"
                      : "bg-gradient-to-r from-rose-700 to-red-500"
                  }`}
                  style={{ width: `${bossHpPct * 100}%` }}
                />
              </div>

              {/* Boss Territory Advantage Buff */}
              {(currentZone === "BOSS_ALTAR" || currentZone === "DUNGEON") && (
                <div className="mt-1 flex items-center justify-between text-[9px] font-bold text-amber-300 bg-amber-950/60 border border-amber-600/40 rounded px-2 py-0.5">
                  <span className="flex items-center gap-1">
                    <span>🔥</span>
                    <span>HƯỞNG LỢI LÃNH ĐỊA</span>
                  </span>
                  <span className="font-mono text-amber-200">+25% DEF, HỒI 1% HP/S</span>
                </div>
              )}

              {/* Stagger Armor Bar */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-mono text-amber-400 font-bold shrink-0">GIÁP</span>
                <div className="flex-1 bg-slate-950 rounded-full h-1.5 border border-amber-600/40 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${
                      bossIsStaggered
                        ? "bg-yellow-300 shadow-[0_0_10px_#facc15] animate-pulse"
                        : "bg-gradient-to-r from-amber-500 to-yellow-400"
                    }`}
                    style={{ width: `${bossStagger}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono font-bold text-amber-300 shrink-0">
                  {Math.round(bossStagger)}%
                </span>
              </div>

              {/* Stagger Alert Banner */}
              {bossIsStaggered && (
                <div className="mt-1 text-center text-[10px] font-black tracking-wider text-amber-300 bg-amber-500/20 border border-amber-400/50 rounded py-0.5 animate-bounce">
                  ⚡ BOSS BỊ PHÁ GIÁP! CHOÁNG VÁNG — SÁT THƯƠNG 1.5X!
                </div>
              )}

              {/* Casting Spell Alert */}
              {!bossIsStaggered && bossCastingSpell && (
                <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-rose-300 bg-rose-950/60 border border-rose-500/50 rounded px-2 py-0.5 animate-pulse">
                  <span>⚠️ NIỆM: <span className="text-white font-black">{bossCastingSpell}</span></span>
                  <span className="font-mono text-yellow-300">{Math.max(0, bossCastingTimer).toFixed(1)}s</span>
                </div>
              )}
            </div>
          )}

          {/* Level Suppression Badge */}
          {isLevelSuppressed && (
            <div className="mt-1.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/90 border border-red-500/80 text-rose-300 font-mono text-[10px] font-black tracking-wider animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]">
              <span>⚠️ ÁP CHẾ CẤP ĐỘ (-40% CÔNG THỦ, QUÁI NÉ TRÁNH TĂNG)</span>
            </div>
          )}

          {/* Smooth Zone Transition Notice */}
          {zoneNotification && (
            <div className="mt-2 bg-[#0a0514]/90 backdrop-blur-lg border border-cyan-500/50 rounded-full px-5 py-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] text-xs font-black tracking-widest uppercase text-cyan-300 animate-bounce">
              {zoneNotification}
            </div>
          )}

          {/* Dynamic Weather & Zone Status */}
          <div className="mt-1 text-[10px] font-mono text-slate-400 flex items-center gap-2">
            <span>
              {weather === "SUNNY" ? "☀️ Trời Nắng Ráo" : weather === "RAIN" ? "🌧️ Mưa Giông (Tầm quái -20%, Kỹ năng +25%)" : "🩸 Huyết Nguyệt (Quái Cuồng Bạo)"}
            </span>
          </div>
        </div>

        {/* Top-Right: Zoomable Minimap Radar + Collapsible 12-Button System Tray */}
        <RightTopMinimapAndDrawer onLogout={onLogout} />
      </div>

      {/* ── RIGHT EDGE QUICK DOCK: Semi-Circle Tabs for Chat & Adventure Logs ── */}
      <RightEdgeQuickDock />

      {/* ── BOTTOM SECTION: Action Combat Bar, Mobile Controls & Bottom-Right Enemy HP Bars ── */}
      <div className="flex items-end justify-between w-full">
        
        {/* Mobile Virtual Joystick (Left) */}
        {isMobile ? (
          <div
            ref={joystickAreaRef}
            className="pointer-events-auto relative w-28 h-28 rounded-full bg-[#0a0514]/70 border-2 border-cyan-500/40 backdrop-blur-md flex items-center justify-center touch-none select-none shadow-[0_0_20px_rgba(6,182,212,0.25)]"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <div
              className="w-12 h-12 rounded-full bg-cyan-500/50 border border-cyan-300 shadow-[0_0_15px_#00f2ff] pointer-events-none"
              style={{
                transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
                transition: knobPos.x === 0 && knobPos.y === 0 ? "transform 0.15s ease-out" : "none",
              }}
            />
          </div>
        ) : (
          <div className="w-28" />
        )}

        {/* Center: Symmetrical Action HUD (Collapsible 1-Row / 2-Row Skill Deck, Auto-fade in village, Auto-fading Combo pill) */}
        <SymmetricalActionHUD />

        {/* Bottom-Right: Smart Target Enemy HP Bars (Filtered in Safe Village / Out-of-Combat, with Quick Dismiss) */}
        <div className="min-w-[200px] flex flex-col items-end gap-1.5">
          <PixelEnemyHealthBars />
        </div>
      </div>

      {/* ── Compact Monster Kill Toast Tab ── */}
      {combatKillToast && (
        <div
          className="fixed top-24 right-4 z-40 pointer-events-none animate-in fade-in slide-in-from-right-4 duration-200 select-none"
        >
          <div className="w-[280px] sm:w-[320px] rounded-2xl bg-[#0e131ef2] border border-cyan-400/60 shadow-[0_10px_30px_rgba(0,0,0,0.85),0_0_20px_rgba(40,195,225,0.3)] p-2.5 backdrop-blur-md flex flex-col gap-1.5 overflow-hidden">
            {/* Header: Monster Name + Level */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm">⚔️</span>
                <p className="text-xs font-black text-white truncate">
                  Hạ gục: <span className="text-cyan-300">{combatKillToast.monsterName}</span>
                </p>
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-300 px-1.5 py-0.5 rounded bg-black/60 border border-slate-700 shrink-0">
                Cấp {combatKillToast.monsterLevel}
              </span>
            </div>

            {/* EXP + Gold + Drops */}
            <div className="flex items-center justify-between text-[11px] font-mono bg-black/50 px-2 py-1 rounded-xl border border-slate-800">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                ✦ +{combatKillToast.expGained} EXP
              </span>
              <span className="text-amber-300 font-bold flex items-center gap-1">
                🪙 +{combatKillToast.goldGained} Vàng
              </span>
              {combatKillToast.drops.length > 0 && (
                <span className="text-purple-300 font-bold flex items-center gap-0.5">
                  🎁 x{combatKillToast.drops.length}
                </span>
              )}
            </div>

            {/* Auto-dismiss countdown bar */}
            <div className="w-full h-0.5 bg-slate-800/80 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 animate-shrink-timer" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
