import { memo, useRef, useState, useEffect } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { mobileState } from "@/game/mobileControls";
import { 
  Backpack, 
  ShoppingBag, 
  Trophy, 
  ScrollText, 
  LogOut, 
  Flame, 
  Sparkles, 
  Shield, 
  Zap, 
  Sword,
  Target
} from "lucide-react";

export interface UnifiedGameHUDProps {
  onLogout?: () => void;
}

export const UnifiedGameHUD = memo(function UnifiedGameHUD({
  onLogout,
}: UnifiedGameHUDProps) {
  // Store values
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

  const currentZone = useGameWorldStore((s) => s.currentZone);
  const zoneNotification = useGameWorldStore((s) => s.zoneNotification);
  const bossName = useGameWorldStore((s) => s.bossName);
  const bossHealth = useGameWorldStore((s) => s.bossHealth);
  const bossMaxHealth = useGameWorldStore((s) => s.bossMaxHealth);
  const bossActive = useGameWorldStore((s) => s.bossActive);

  const skillCooldowns = useGameWorldStore((s) => s.skillCooldowns);
  const triggerSkill = useGameWorldStore((s) => s.triggerSkill);
  const setActiveModal = useGameWorldStore((s) => s.setActiveModal);

  // Compute percentages
  const hpPct = Math.max(0, Math.min(1, playerHealth / Math.max(1, playerMaxHealth)));
  const expPct = playerExpToNext > 0 ? Math.min(100, (playerExp / playerExpToNext) * 100) : 0;
  const bossHpPct = Math.max(0, Math.min(1, bossHealth / Math.max(1, bossMaxHealth)));

  // Touch joystick handling for Mobile
  const joystickAreaRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
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
    handleTouchStart(e);
  };

  const handleTouchEnd = () => {
    setKnobPos({ x: 0, y: 0 });
    mobileState.joystick.x = 0;
    mobileState.joystick.y = 0;
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 select-none font-sans">
      
      {/* ── TOP SECTION: Character Card (Left), Boss Bar / Zone Banner (Center), Menu Buttons (Right) ── */}
      <div className="flex items-start justify-between w-full">
        
        {/* Top-Left: Character Card */}
        <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3 shadow-2xl flex items-center gap-3 min-w-[270px] max-w-sm">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-inner border border-white/20 shrink-0"
            style={{ backgroundColor: playerColorHex }}
          >
            {playerClassId === "gunner" ? "🎯" : playerClassId === "assassin" ? "🗡️" : playerClassId === "fighter" ? "🥊" : "🛡️"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-extrabold text-sm text-slate-100 truncate">{playerName}</span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-300">
                Lv.{playerLevel} {playerClassName}
              </span>
            </div>

            {/* Health Bar */}
            <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-700/60 overflow-hidden relative mb-1">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${hpPct * 100}%`,
                  background: hpPct > 0.5 ? "linear-gradient(90deg, #10b981, #34d399)" : hpPct > 0.25 ? "linear-gradient(90deg, #f59e0b, #fbbf24)" : "linear-gradient(90deg, #ef4444, #f87171)",
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-extrabold text-white drop-shadow">
                {playerHealth} / {playerMaxHealth} HP
              </span>
            </div>

            {/* EXP Bar */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 gap-1.5">
              <div className="flex-1 bg-slate-900 rounded-full h-1.5 border border-slate-700/40 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${expPct}%` }}
                />
              </div>
              <span className="font-mono text-[9px]">{Math.floor(expPct)}%</span>
            </div>

            {/* Gold & Kills Badge */}
            <div className="flex items-center gap-3 mt-1 text-[11px] font-bold">
              <span className="text-amber-400 flex items-center gap-1">
                🪙 {playerGold} Vàng
              </span>
              <span className="text-red-400 flex items-center gap-1">
                ⚔️ {playerKills} Quái
              </span>
            </div>
          </div>
        </div>

        {/* Top-Center: Zone Notification Banner & Boss Health Bar */}
        <div className="flex flex-col items-center flex-1 max-w-md mx-3">
          {/* Boss HP Bar */}
          {(bossActive || currentZone === "BOSS_ALTAR") && (
            <div className="pointer-events-auto w-full bg-slate-950/90 backdrop-blur-md border-2 border-red-500/80 rounded-2xl p-2.5 shadow-[0_0_25px_rgba(239,68,68,0.5)] mb-2 animate-pulse">
              <div className="flex items-center justify-between text-xs font-black mb-1">
                <span className="text-red-400 flex items-center gap-1">
                  <Flame className="w-4 h-4 text-orange-500 animate-spin" /> {bossName}
                </span>
                <span className="text-amber-400 font-mono">
                  {bossHealth} / {bossMaxHealth}
                </span>
              </div>
              <div className="w-full bg-red-950/80 rounded-full h-3.5 border border-red-500/60 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 transition-all duration-200"
                  style={{ width: `${bossHpPct * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Smooth Zone Transition Notice */}
          {zoneNotification && (
            <div className="bg-slate-950/90 backdrop-blur-lg border border-cyan-500/50 rounded-full px-5 py-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] text-xs font-extrabold tracking-wide text-cyan-300 animate-bounce">
              {zoneNotification}
            </div>
          )}
        </div>

        {/* Top-Right: Glassmorphism Modals Navigation */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Inventory (I) */}
          <button
            onClick={() => setActiveModal("inventory")}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-950/80 hover:bg-slate-900 border border-slate-700 hover:border-cyan-400 rounded-xl text-slate-200 hover:text-cyan-300 text-xs font-bold transition shadow-lg backdrop-blur-md cursor-pointer"
            title="Túi Đồ (Phím I)"
          >
            <Backpack className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Túi Đồ (I)</span>
          </button>

          {/* Shop (B) */}
          <button
            onClick={() => setActiveModal("shop")}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-950/80 hover:bg-slate-900 border border-slate-700 hover:border-amber-400 rounded-xl text-slate-200 hover:text-amber-300 text-xs font-bold transition shadow-lg backdrop-blur-md cursor-pointer"
            title="Cửa Hàng (Phím B)"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Cửa Hàng (B)</span>
          </button>

          {/* Leaderboard (L) */}
          <button
            onClick={() => setActiveModal("leaderboard")}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-950/80 hover:bg-slate-900 border border-slate-700 hover:border-purple-400 rounded-xl text-slate-200 hover:text-purple-300 text-xs font-bold transition shadow-lg backdrop-blur-md cursor-pointer"
            title="Bảng Xếp Hạng (Phím L)"
          >
            <Trophy className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">BXH (L)</span>
          </button>

          {/* Battle Logs (H) */}
          <button
            onClick={() => setActiveModal("battleLog")}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-950/80 hover:bg-slate-900 border border-slate-700 hover:border-red-400 rounded-xl text-slate-200 hover:text-red-300 text-xs font-bold transition shadow-lg backdrop-blur-md cursor-pointer"
            title="Lịch Sử Chiến Báo (Phím H)"
          >
            <ScrollText className="w-4 h-4 text-red-400" />
            <span className="hidden sm:inline">Chiến Báo</span>
          </button>

          {/* Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 bg-slate-950/80 hover:bg-red-950/80 border border-slate-700 hover:border-red-500 rounded-xl text-slate-400 hover:text-red-300 transition shadow-lg backdrop-blur-md cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── BOTTOM SECTION: Virtual Joystick (Left) & Action Bar (Center / Right) ── */}
      <div className="flex items-end justify-between w-full pb-2">
        
        {/* Mobile Virtual Joystick */}
        {isMobile ? (
          <div
            ref={joystickAreaRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="pointer-events-auto relative w-28 h-28 rounded-full bg-slate-900/60 border-2 border-slate-700/80 backdrop-blur-md flex items-center justify-center shadow-2xl ml-2 touch-none"
          >
            <div
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 border-2 border-white/40 shadow-lg transform transition-transform"
              style={{
                transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
              }}
            />
          </div>
        ) : (
          <div className="w-28" /> // Spacer for desktop layout balance
        )}

        {/* Center Action Bar: Attack, Shoot, Skills 1, 2, 3 */}
        <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-2xl p-2.5 shadow-2xl flex items-center gap-2.5">
          {/* Normal Attack (J) */}
          <button
            onClick={() => { mobileState.attack = true; }}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-red-600/30 hover:bg-red-600/50 border border-red-500/60 text-red-200 transition active:scale-95 cursor-pointer"
            title="Đánh Thường (Phím J)"
          >
            <Sword className="w-5 h-5 text-red-400" />
            <span className="text-[9px] font-mono font-bold text-red-300">J / Đánh</span>
          </button>

          {/* Ranged Shoot (K) */}
          <button
            onClick={() => { mobileState.shoot = true; }}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/60 text-cyan-200 transition active:scale-95 cursor-pointer"
            title="Bắn Đạn (Phím K)"
          >
            <Target className="w-5 h-5 text-cyan-400" />
            <span className="text-[9px] font-mono font-bold text-cyan-300">K / Bắn</span>
          </button>

          <div className="w-px h-8 bg-slate-800" />

          {/* Skill 1 (Phím 1) */}
          <button
            onClick={() => triggerSkill(1)}
            disabled={(skillCooldowns.skill1 || 0) > 0}
            className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-xl border transition active:scale-95 cursor-pointer ${
              (skillCooldowns.skill1 || 0) > 0
                ? "bg-slate-900 border-slate-800 text-slate-500"
                : "bg-amber-600/30 hover:bg-amber-600/50 border-amber-500/60 text-amber-200"
            }`}
          >
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="text-[9px] font-mono font-bold">1 / Chiêu</span>
            {(skillCooldowns.skill1 || 0) > 0 && (
              <span className="absolute inset-0 bg-black/75 rounded-xl flex items-center justify-center text-xs font-mono font-black text-amber-300">
                {Math.ceil(skillCooldowns.skill1)}s
              </span>
            )}
          </button>

          {/* Skill 2 (Phím 2) */}
          <button
            onClick={() => triggerSkill(2)}
            disabled={(skillCooldowns.skill2 || 0) > 0}
            className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-xl border transition active:scale-95 cursor-pointer ${
              (skillCooldowns.skill2 || 0) > 0
                ? "bg-slate-900 border-slate-800 text-slate-500"
                : "bg-purple-600/30 hover:bg-purple-600/50 border-purple-500/60 text-purple-200"
            }`}
          >
            <Shield className="w-5 h-5 text-purple-400" />
            <span className="text-[9px] font-mono font-bold">2 / Chiêu</span>
            {(skillCooldowns.skill2 || 0) > 0 && (
              <span className="absolute inset-0 bg-black/75 rounded-xl flex items-center justify-center text-xs font-mono font-black text-purple-300">
                {Math.ceil(skillCooldowns.skill2)}s
              </span>
            )}
          </button>

          {/* Skill 3 (Phím 3 - Nộ) */}
          <button
            onClick={() => triggerSkill(3)}
            disabled={(skillCooldowns.skill3 || 0) > 0}
            className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-xl border transition active:scale-95 cursor-pointer ${
              (skillCooldowns.skill3 || 0) > 0
                ? "bg-slate-900 border-slate-800 text-slate-500"
                : "bg-red-700/40 hover:bg-red-700/60 border-red-500/80 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
            }`}
          >
            <Sparkles className="w-5 h-5 text-orange-400" />
            <span className="text-[9px] font-mono font-bold text-orange-300">3 / Nộ</span>
            {(skillCooldowns.skill3 || 0) > 0 && (
              <span className="absolute inset-0 bg-black/75 rounded-xl flex items-center justify-center text-xs font-mono font-black text-red-400">
                {Math.ceil(skillCooldowns.skill3)}s
              </span>
            )}
          </button>
        </div>

        {/* Right Space */}
        <div className="w-28" />
      </div>
    </div>
  );
});
