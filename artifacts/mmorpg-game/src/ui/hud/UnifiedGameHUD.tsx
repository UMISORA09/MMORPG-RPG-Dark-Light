// ==============================================================================
// Dark-Light RPG HUD — UnifiedGameHUD
// Integrates:
// 1. PlayerStatusFrame (Beveled metallic gold-bronze frame, delayed HP bar, EXP & passives)
// 2. MinimapRadar (Live compass bezel, player arrow, sanctuary ring, monsters, boss & loot)
// 3. ActionCombatBar (Hexagonal/beveled skill slots, Combo 1-2-3, conic-gradient cooldown sweeps)
// 4. Boss Raid Health Bar & Smooth Zone Notice
// 5. Strict Pointer-Events isolation preventing unintended click-through
// ==============================================================================

import { memo, useRef, useState, useEffect } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { useGameStore } from "@/game/useGameStore";
import { mobileState } from "@/game/mobileControls";
import { PlayerStatusFrame } from "./PlayerStatusFrame";
import { MinimapRadar } from "./MinimapRadar";
import { ActionCombatBar } from "./ActionCombatBar";
import { SymmetricalActionHUD } from "./SymmetricalActionHUD";
import { PixelEnemyHealthBars } from "./PixelEnemyHealthBars";
import { DungeonSelectModal } from "../modals/DungeonSelectModal";
import { QuestTrackerHUD } from "./QuestTrackerHUD";
import { 
  Backpack, 
  ShoppingBag, 
  Trophy, 
  ScrollText, 
  LogOut, 
  Box, 
  Settings,
  Crown,
  Volume2,
  VolumeX,
  BarChart3,
  Award,
  Gift
} from "lucide-react";

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

  const characterRenderMode = useGameWorldStore((s) => s.characterRenderMode);
  const toggleCharacterRenderMode = useGameWorldStore((s) => s.toggleCharacterRenderMode);

  // Mount & GM Admin tooling
  const isMounted = useGameWorldStore((s) => s.isMounted);
  const toggleMount = useGameWorldStore((s) => s.toggleMount);
  const toggleGMAdmin = useGameWorldStore((s) => s.toggleGMAdmin);
  const godMode = useGameWorldStore((s) => s.godMode);
  const soundMuted = useGameWorldStore((s) => s.soundMuted);
  const toggleSoundMute = useGameWorldStore((s) => s.toggleSoundMute);

  const openModal = (modal: "inventory" | "shop" | "leaderboard" | "battleLog" | "settings" | "achievements" | "dailyRewards") => {
    useGameWorldStore.getState().setActiveModal(modal);
    if (modal === "battleLog") {
      useGameStore.getState().setActiveModal("battle_logs");
    } else if (modal !== "settings" && modal !== "achievements" && modal !== "dailyRewards") {
      useGameStore.getState().setActiveModal(modal);
    }
  };

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
    mobileState.joystick.x = dist > 5 ? dx / maxRadius : 0;
    mobileState.joystick.y = dist > 5 ? dy / maxRadius : 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    handleTouchStart(e);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    setKnobPos({ x: 0, y: 0 });
    mobileState.joystick.x = 0;
    mobileState.joystick.y = 0;
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 select-none font-sans">
      
      {/* ── TOP SECTION: Player Status (Left), Boss Bar / Zone Banner (Center), Minimap & Menu (Right) ── */}
      <div className="flex items-start justify-between w-full">
        
        {/* Top-Left: Player Status Frame & Quest Tracker */}
        <div className="flex flex-col gap-2">
          <PlayerStatusFrame />
          <QuestTrackerHUD />
        </div>

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

        {/* Top-Right: Minimap Radar + Quick Action Navigation Icons */}
        <div className="flex flex-col items-end gap-2">
          {/* Real-Time Minimap Radar */}
          <MinimapRadar />

          {/* Quick Action Navigation Icons */}
          <div
            className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-2xl bg-[#0a0514]/85 backdrop-blur-md border border-slate-800 shadow-xl"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mode Toggle (2.5D Sprite <-> 3D Model) */}
            <button
              onClick={toggleCharacterRenderMode}
              className={`p-2 border rounded-xl transition cursor-pointer ${
                characterRenderMode === "3d_model"
                  ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
              }`}
              title="Chuyển chế độ 2.5D Sprite / 3D Model (Phím V)"
            >
              <Box className="w-4 h-4" />
            </button>

            {/* Hành Trang (B / I) */}
            <button
              onClick={() => openModal("inventory")}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 rounded-xl text-cyan-300 transition cursor-pointer"
              title="Hành Trang & Trang Bị (Phím B hoặc I)"
            >
              <Backpack className="w-4 h-4" />
            </button>

            {/* Cửa Hàng (P) */}
            <button
              onClick={() => openModal("shop")}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 rounded-xl text-amber-300 transition cursor-pointer"
              title="Cửa Hàng (Phím P)"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>

            {/* Bảng Xếp Hạng (O) */}
            <button
              onClick={() => openModal("leaderboard")}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-purple-400 rounded-xl text-purple-300 transition cursor-pointer"
              title="Bảng Vinh Danh Long Tộc (Phím O)"
            >
              <Trophy className="w-4 h-4" />
            </button>

            {/* 📊 Lịch Sử Chiến Đấu (Battle Logs) - Phím H */}
            <button
              onClick={() => openModal("battleLog")}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-red-400 rounded-xl text-red-300 transition cursor-pointer flex items-center justify-center"
              title="📊 Lịch Sử Chiến Đấu (Battle Logs) - Phím H"
            >
              <ScrollText className="w-4 h-4" />
            </button>

            {/* 🏆 Bảng Thành Tựu (Phím Y) */}
            <button
              onClick={() => openModal("achievements")}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 rounded-xl text-amber-400 transition cursor-pointer flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.2)]"
              title="🏆 Bảng Thành Tựu & Cột Mốc Danh Vọng (Phím Y)"
            >
              <Award className="w-4 h-4" />
            </button>

            {/* 🎁 Quà Đăng Nhập 7 Ngày (Phím U) */}
            <button
              onClick={() => openModal("dailyRewards")}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-400 rounded-xl text-emerald-400 transition cursor-pointer flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              title="🎁 Quà Đăng Nhập 7 Ngày Liên Tục (Phím U)"
            >
              <Gift className="w-4 h-4" />
            </button>

            {/* Cưỡi Thú (Z / M) */}
            <button
              onClick={toggleMount}
              className={`p-2 border rounded-xl transition cursor-pointer flex items-center justify-center text-xs ${
                isMounted
                  ? "bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(40,195,225,0.45)]"
                  : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
              }`}
              title="Cưỡi Thú (+70% Tốc Độ) - Phím Z hoặc M"
            >
              🐎
            </button>

            {/* GM Admin Demo Panel (F12) */}
            <button
              onClick={toggleGMAdmin}
              className={`p-2 border rounded-xl transition cursor-pointer flex items-center justify-center ${
                godMode
                  ? "bg-rose-500/30 border-rose-400 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                  : "bg-slate-900 border-slate-700 text-rose-400 hover:text-rose-300 hover:border-rose-500"
              }`}
              title="Bảng Quản Trị Viên (GM Admin Demo) - Phím F12"
            >
              <Crown className="w-4 h-4 text-rose-400" />
            </button>

            {/* Bật/Tắt Âm Thanh Game (Sound Mute Toggle) */}
            <button
              onClick={toggleSoundMute}
              className={`p-2 border rounded-xl transition cursor-pointer flex items-center justify-center ${
                soundMuted
                  ? "bg-red-950/70 border-red-700/80 text-red-400 hover:text-red-300 hover:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                  : "bg-cyan-950/60 border-cyan-700/80 text-cyan-400 hover:text-cyan-300 hover:border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.25)]"
              }`}
              title={soundMuted ? "🔇 Bật Âm Thanh Game (Web Audio API Đang Tắt)" : "🔊 Tắt Âm Thanh Game (Web Audio API Đang Bật)"}
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Cài Đặt */}
            <button
              onClick={() => openModal("settings")}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 rounded-xl text-slate-300 hover:text-white transition cursor-pointer"
              title="Cài Đặt Game"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Logout */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 bg-slate-900 hover:bg-red-950 border border-slate-700 hover:border-red-500 rounded-xl text-slate-400 hover:text-red-300 transition cursor-pointer"
                title="Đăng Xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

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

        {/* Center: Symmetrical Action HUD (Totem Emblem, Dual Wing Gauges, Left 10 Skills, Right 10 Consumables, Master EXP Bar) */}
        <SymmetricalActionHUD />

        {/* Bottom-Right: Active Target Enemy HP Bars (e.g. SLIME) */}
        <div className="min-w-[200px] flex flex-col items-end gap-1.5">
          <PixelEnemyHealthBars />
        </div>
      </div>
    </div>
  );
});
