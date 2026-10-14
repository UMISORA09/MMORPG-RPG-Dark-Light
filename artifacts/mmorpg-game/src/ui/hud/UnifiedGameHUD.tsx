import { memo, useRef, useState, useEffect } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { mobileState } from "@/game/mobileControls";
import { getCharacterBlueprint } from "@/skills";
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
  Target,
  ChevronRight
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

  const comboIndex = useGameWorldStore((s) => s.comboIndex);
  const comboTimer = useGameWorldStore((s) => s.comboTimer);
  const passiveCounter = useGameWorldStore((s) => s.passiveCounter);
  const passiveActive = useGameWorldStore((s) => s.passiveActive);
  const passiveFuryPercent = useGameWorldStore((s) => s.passiveFuryPercent);

  const currentZone = useGameWorldStore((s) => s.currentZone);
  const zoneNotification = useGameWorldStore((s) => s.zoneNotification);
  const bossName = useGameWorldStore((s) => s.bossName);
  const bossHealth = useGameWorldStore((s) => s.bossHealth);
  const bossMaxHealth = useGameWorldStore((s) => s.bossMaxHealth);
  const bossActive = useGameWorldStore((s) => s.bossActive);

  const skillCooldowns = useGameWorldStore((s) => s.skillCooldowns);
  const triggerComboAttack = useGameWorldStore((s) => s.triggerComboAttack);
  const triggerSkill = useGameWorldStore((s) => s.triggerSkill);
  const setActiveModal = useGameWorldStore((s) => s.setActiveModal);

  // Compute percentages
  const hpPct = Math.max(0, Math.min(1, playerHealth / Math.max(1, playerMaxHealth)));
  const expPct = playerExpToNext > 0 ? Math.min(100, (playerExp / playerExpToNext) * 100) : 0;
  const bossHpPct = Math.max(0, Math.min(1, bossHealth / Math.max(1, bossMaxHealth)));

  const blueprint = getCharacterBlueprint(playerClassId);

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
        
        {/* Top-Left: Character Card & Passive Indicator */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3 shadow-2xl flex items-center gap-3 min-w-[280px] max-w-sm">
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

          {/* ── Class Passive Status Tracker ── */}
          <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl px-2.5 py-1.5 shadow-lg flex items-center justify-between gap-2 text-xs min-w-[280px]">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-base">{blueprint.passive.icon}</span>
              <span className="font-bold text-slate-200 text-[11px] truncate">{blueprint.passive.name.split(" (")[0]}</span>
            </div>

            {/* Class-Specific Passive Display */}
            {playerClassId === "gunner" && (
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3].map((step) => {
                  const isFilled = passiveCounter > step || (passiveActive && step === 3);
                  return (
                    <div
                      key={step}
                      className={`w-3 h-3 rounded-full border transition-all ${
                        isFilled
                          ? step === 3
                            ? "bg-red-500 border-red-300 shadow-[0_0_8px_#ef4444]"
                            : "bg-cyan-400 border-cyan-200 shadow-[0_0_6px_#00f2ff]"
                          : "bg-slate-800 border-slate-700"
                      }`}
                      title={step === 3 ? "Phát 4: CHÍ MẠNG 200%" : `Đạn nạp ${step + 1}`}
                    />
                  );
                })}
              </div>
            )}

            {playerClassId === "fighter" && (
              <div className="flex items-center gap-1.5">
                <div className="w-16 bg-slate-900 rounded-full h-2 border border-orange-500/50 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-300"
                    style={{ width: `${passiveFuryPercent}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-orange-400">+{Math.round(passiveFuryPercent * 0.6)}% ATK</span>
              </div>
            )}

            {playerClassId === "assassin" && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                +50% DMG Lướt/Lưng
              </span>
            )}

            {playerClassId === "tank" && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                -30% DMG / Phản Kích
              </span>
            )}
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

      {/* ── BOTTOM SECTION: Virtual Joystick (Left) & Combo Chain + Action Bar (Center) ── */}
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

        {/* Center: 3-Hit Combo Flow Indicator + Action Skills Bar */}
        <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
          
          {/* ── 3-Hit Combo Flow Tracker ── */}
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-xl">
            {blueprint.comboAttacks.map((combo, idx) => {
              const isCurrent = comboIndex === idx;
              const isPast = comboIndex > idx && comboTimer > 0;
              return (
                <div key={combo.id} className="flex items-center gap-1">
                  <div
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 ${
                      isCurrent
                        ? "bg-amber-500 text-slate-950 font-black shadow-[0_0_10px_#f59e0b] scale-105"
                        : isPast
                        ? "bg-slate-800 text-slate-400"
                        : "bg-slate-900/60 text-slate-500"
                    }`}
                  >
                    <span>{idx + 1}.</span>
                    <span>{combo.name.split(" ")[0]}</span>
                    {isCurrent && comboTimer > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping ml-0.5" />
                    )}
                  </div>
                  {idx < 2 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                </div>
              );
            })}
          </div>

          {/* Action Buttons: Combo Attack (J), Skills 1, 2, 3 */}
          {(() => {
            const currentComboSpec = blueprint.comboAttacks[comboIndex] || blueprint.comboAttacks[0];
            const s1 = blueprint.skills[0];
            const s2 = blueprint.skills[1];
            const s3 = blueprint.skills[2];

            return (
              <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-2xl p-2.5 shadow-2xl flex items-center gap-2.5">
                {/* 3-Hit Combo Attack Button (J / Attack) */}
                <button
                  onClick={() => triggerComboAttack()}
                  className="relative flex flex-col items-center justify-center min-w-[62px] h-12 px-2 rounded-xl bg-red-600/30 hover:bg-red-600/50 border border-red-500/60 text-red-200 transition active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.25)]"
                  title={`Chuỗi Combo 3 Nhịp: ${currentComboSpec.name} (Phím J)`}
                >
                  {playerClassId === "gunner" ? (
                    <Target className="w-5 h-5 text-cyan-400" />
                  ) : (
                    <Sword className="w-5 h-5 text-red-400" />
                  )}
                  <span className="text-[9px] font-mono font-bold text-red-300 truncate max-w-[64px]">
                    J / Đòn {comboIndex + 1}
                  </span>
                  {comboTimer > 0 && (
                    <div
                      className="absolute bottom-0 left-1 right-1 h-0.5 bg-amber-400 rounded-full transition-all"
                      style={{ width: `${(comboTimer / 0.85) * 100}%` }}
                    />
                  )}
                </button>

                <div className="w-px h-8 bg-slate-800" />

                {/* Skill 1 (Phím K / 1) */}
                {s1 && (
                  <button
                    onClick={() => triggerSkill(1)}
                    disabled={(skillCooldowns.skill1 || 0) > 0}
                    className={`relative flex flex-col items-center justify-center min-w-[56px] h-12 px-2 rounded-xl border transition active:scale-95 cursor-pointer ${
                      (skillCooldowns.skill1 || 0) > 0
                        ? "bg-slate-900 border-slate-800 text-slate-500"
                        : "bg-amber-600/30 hover:bg-amber-600/50 border-amber-500/60 text-amber-200"
                    }`}
                    title={`${s1.name}: ${s1.description}`}
                  >
                    <Zap className="w-5 h-5 text-amber-400" />
                    <span className="text-[9px] font-mono font-bold truncate max-w-[64px]">
                      {s1.keybind} / {s1.name.split(" ")[0]}
                    </span>
                    {(skillCooldowns.skill1 || 0) > 0 && (
                      <span className="absolute inset-0 bg-black/75 rounded-xl flex items-center justify-center text-xs font-mono font-black text-amber-300">
                        {Math.ceil(skillCooldowns.skill1)}s
                      </span>
                    )}
                  </button>
                )}

                {/* Skill 2 (Phím L / 2) */}
                {s2 && (
                  <button
                    onClick={() => triggerSkill(2)}
                    disabled={(skillCooldowns.skill2 || 0) > 0}
                    className={`relative flex flex-col items-center justify-center min-w-[56px] h-12 px-2 rounded-xl border transition active:scale-95 cursor-pointer ${
                      (skillCooldowns.skill2 || 0) > 0
                        ? "bg-slate-900 border-slate-800 text-slate-500"
                        : "bg-purple-600/30 hover:bg-purple-600/50 border-purple-500/60 text-purple-200"
                    }`}
                    title={`${s2.name}: ${s2.description}`}
                  >
                    <Shield className="w-5 h-5 text-purple-400" />
                    <span className="text-[9px] font-mono font-bold truncate max-w-[64px]">
                      {s2.keybind} / {s2.name.split(" ")[0]}
                    </span>
                    {(skillCooldowns.skill2 || 0) > 0 && (
                      <span className="absolute inset-0 bg-black/75 rounded-xl flex items-center justify-center text-xs font-mono font-black text-purple-300">
                        {Math.ceil(skillCooldowns.skill2)}s
                      </span>
                    )}
                  </button>
                )}

                {/* Skill 3 (Phím U / 3 - Nộ/Ultimate) */}
                {s3 && (
                  <button
                    onClick={() => triggerSkill(3)}
                    disabled={(skillCooldowns.skill3 || 0) > 0}
                    className={`relative flex flex-col items-center justify-center min-w-[56px] h-12 px-2 rounded-xl border transition active:scale-95 cursor-pointer ${
                      (skillCooldowns.skill3 || 0) > 0
                        ? "bg-slate-900 border-slate-800 text-slate-500"
                        : "bg-red-700/40 hover:bg-red-700/60 border-red-500/80 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                    }`}
                    title={`${s3.name}: ${s3.description}`}
                  >
                    <Sparkles className="w-5 h-5 text-orange-400" />
                    <span className="text-[9px] font-mono font-bold truncate max-w-[64px]">
                      {s3.keybind} / {s3.name.split(" ")[0]}
                    </span>
                    {(skillCooldowns.skill3 || 0) > 0 && (
                      <span className="absolute inset-0 bg-black/75 rounded-xl flex items-center justify-center text-xs font-mono font-black text-red-400">
                        {Math.ceil(skillCooldowns.skill3)}s
                      </span>
                    )}
                  </button>
                )}
              </div>
            );
          })()}
        </div>

        {/* Right Space */}
        <div className="w-28" />
      </div>
    </div>
  );
});
