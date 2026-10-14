import { memo } from "react";
import { useGameStore } from "../../stores";
import { Backpack, ShoppingBag, Trophy, ScrollText, LogOut, Swords, Flame, Sparkles, Heart, Shield, Zap } from "lucide-react";

export interface HUDProps {
  onLogout?: () => void;
}

const HUD = memo(function HUD({ onLogout }: HUDProps) {
  const player = useGameStore((s) => s.player);
  const game = useGameStore((s) => s.game);
  const triggerSkill = useGameStore((s) => s.triggerSkill);
  const setActiveModal = useGameStore((s) => s.setActiveModal);

  const hpPct = Math.max(0, Math.min(1, player.health / Math.max(1, player.maxHealth)));
  const expPct = player.expToNext > 0 ? Math.min(100, (player.exp / player.expToNext) * 100) : 0;
  const bossHpPct = Math.max(0, Math.min(1, game.bossHealth / Math.max(1, game.bossMaxHealth)));

  const classBadges: Record<string, { label: string; color: string; bg: string }> = {
    gunner: { label: "🎯 Xạ Thủ", color: "#38bdf8", bg: "rgba(2, 132, 199, 0.25)" },
    assassin: { label: "🗡️ Sát Thủ", color: "#c084fc", bg: "rgba(147, 51, 234, 0.25)" },
    fighter: { label: "🥊 Đấu Sĩ", color: "#f87171", bg: "rgba(220, 38, 38, 0.25)" },
    tank: { label: "🛡️ Đỡ Đòn", color: "#fbbf24", bg: "rgba(217, 119, 6, 0.25)" },
  };

  const currentClass = classBadges[player.classId] || { label: player.className, color: "#a855f7", bg: "rgba(168, 85, 247, 0.25)" };

  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 select-none font-sans">
      
      {/* ── TOP BAR: Player Stats (Left), Boss Bar / Zone Banner (Center), Menu Modals (Right) ── */}
      <div className="flex items-start justify-between w-full">
        
        {/* 1. TOP-LEFT: Player Character Card */}
        <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3 shadow-2xl flex items-center gap-3 min-w-[280px] max-w-sm">
          {/* Avatar Orb */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-inner border border-white/20"
            style={{ backgroundColor: player.colorHex }}
          >
            {player.classId === "gunner" ? "🎯" : player.classId === "assassin" ? "🗡️" : player.classId === "fighter" ? "🥊" : "🛡️"}
          </div>

          {/* Name & Bars */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-extrabold text-sm text-slate-100 truncate">{player.name}</span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded border" style={{ color: currentClass.color, backgroundColor: currentClass.bg, borderColor: currentClass.color }}>
                {currentClass.label}
              </span>
            </div>

            {/* Health Bar */}
            <div className="w-full bg-slate-900 rounded-full h-3.5 border border-slate-700/60 overflow-hidden relative mb-1">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${hpPct * 100}%`,
                  background: hpPct > 0.5 ? "linear-gradient(90deg, #10b981, #34d399)" : hpPct > 0.25 ? "linear-gradient(90deg, #f59e0b, #fbbf24)" : "linear-gradient(90deg, #ef4444, #f87171)",
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-extrabold text-white drop-shadow">
                {player.health} / {player.maxHealth} HP
              </span>
            </div>

            {/* EXP Bar & Level */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 gap-2">
              <span className="font-black text-amber-400">Lv.{player.level}</span>
              <div className="flex-1 bg-slate-900 rounded-full h-1.5 border border-slate-700/40 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${expPct}%` }}
                />
              </div>
              <span className="font-mono text-[9px]">{Math.floor(expPct)}%</span>
            </div>

            {/* Gold & Kills Badge */}
            <div className="flex items-center gap-3 mt-1.5 text-[11px] font-bold">
              <span className="text-amber-400 flex items-center gap-1">
                🪙 {player.gold} Vàng
              </span>
              <span className="text-red-400 flex items-center gap-1">
                ⚔️ {player.kills} Quái
              </span>
            </div>
          </div>
        </div>

        {/* 2. TOP-CENTER: Boss Health Bar & Zone Notification */}
        <div className="flex flex-col items-center flex-1 max-w-md mx-4">
          {/* Boss Bar (When inside Boss Zone or targeting boss) */}
          {(game.bossActive || game.currentZone === "boss_raid") && (
            <div className="pointer-events-auto w-full bg-slate-950/90 backdrop-blur-md border-2 border-red-500/80 rounded-2xl p-2.5 shadow-[0_0_25px_rgba(239,68,68,0.5)] mb-2 animate-pulse">
              <div className="flex items-center justify-between text-xs font-black mb-1">
                <span className="text-red-400 flex items-center gap-1">
                  <Flame className="w-4 h-4 text-orange-500 animate-spin" /> {game.bossName} (Boss Cấp 20)
                </span>
                <span className="text-amber-400 font-mono">
                  {game.bossHealth} / {game.bossMaxHealth}
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

          {/* Smooth Zone Transition Notice Banner */}
          {game.zoneNotification && (
            <div className="bg-slate-950/90 backdrop-blur-lg border border-cyan-500/50 rounded-full px-5 py-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] text-xs font-extrabold tracking-wide text-cyan-300 animate-bounce">
              {game.zoneNotification}
            </div>
          )}
        </div>

        {/* 3. TOP-RIGHT: Glassmorphism Quick Action Buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Inventory Button */}
          <button
            onClick={() => setActiveModal("inventory")}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-950/80 hover:bg-slate-900 border border-slate-700 hover:border-cyan-400 rounded-xl text-slate-200 hover:text-cyan-300 text-xs font-bold transition shadow-lg backdrop-blur-md cursor-pointer"
            title="Túi Đồ (Phím I)"
          >
            <Backpack className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Túi Đồ</span>
          </button>

          {/* Shop Button */}
          <button
            onClick={() => setActiveModal("shop")}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-950/80 hover:bg-slate-900 border border-slate-700 hover:border-amber-400 rounded-xl text-slate-200 hover:text-amber-300 text-xs font-bold transition shadow-lg backdrop-blur-md cursor-pointer"
            title="Cửa Hàng (Phím B)"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Cửa Hàng</span>
          </button>

          {/* Leaderboard Button */}
          <button
            onClick={() => setActiveModal("leaderboard")}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-950/80 hover:bg-slate-900 border border-slate-700 hover:border-purple-400 rounded-xl text-slate-200 hover:text-purple-300 text-xs font-bold transition shadow-lg backdrop-blur-md cursor-pointer"
            title="Bảng Xếp Hạng (Phím L)"
          >
            <Trophy className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">BXH</span>
          </button>

          {/* Battle Logs Button */}
          <button
            onClick={() => setActiveModal("battle_logs")}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-950/80 hover:bg-slate-900 border border-slate-700 hover:border-red-400 rounded-xl text-slate-200 hover:text-red-300 text-xs font-bold transition shadow-lg backdrop-blur-md cursor-pointer"
            title="Lịch Sử Đấu (Phím H)"
          >
            <ScrollText className="w-4 h-4 text-red-400" />
            <span className="hidden sm:inline">Chiến Báo</span>
          </button>

          {/* Logout Button */}
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

      {/* ── BOTTOM BAR: Skills / Attack Action Buttons (Desktop Keybindings & Mobile Touch) ── */}
      <div className="flex items-end justify-center w-full pb-2">
        <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-2xl p-2.5 shadow-2xl flex items-center gap-2">
          {/* Normal Attack (J) */}
          <div className="flex flex-col items-center">
            <button
              className="w-12 h-12 bg-red-950/60 hover:bg-red-900/80 border border-red-500/60 rounded-xl flex items-center justify-center text-red-300 font-black text-lg transition shadow-md active:scale-95"
              title="Đánh Cận Chiến [J]"
            >
              ⚔️
            </button>
            <span className="text-[10px] text-slate-400 mt-1 font-mono font-bold">[J] Đánh</span>
          </div>

          {/* Ranged Shoot (K) */}
          <div className="flex flex-col items-center">
            <button
              className="w-12 h-12 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/60 rounded-xl flex items-center justify-center text-cyan-300 font-black text-lg transition shadow-md active:scale-95"
              title="Bắn Tầm Xa [K]"
            >
              🎯
            </button>
            <span className="text-[10px] text-slate-400 mt-1 font-mono font-bold">[K] Bắn</span>
          </div>

          <div className="w-[1px] h-10 bg-slate-800 mx-1" />

          {/* Skill 1 [1] */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => triggerSkill(1)}
              className="w-12 h-12 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/60 rounded-xl flex items-center justify-center text-purple-300 font-black text-sm relative transition shadow-md active:scale-95 cursor-pointer"
              title="Chiêu 1 [1]"
            >
              {player.skillCooldowns?.skill1 > 0 ? (
                <span className="text-amber-400 font-mono font-extrabold text-base">
                  {Math.ceil(player.skillCooldowns.skill1)}
                </span>
              ) : (
                <Zap className="w-5 h-5 text-purple-400" />
              )}
            </button>
            <span className="text-[10px] text-slate-400 mt-1 font-mono font-bold">[1] Chiêu 1</span>
          </div>

          {/* Skill 2 [2] */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => triggerSkill(2)}
              className="w-12 h-12 bg-blue-950/60 hover:bg-blue-900/80 border border-blue-500/60 rounded-xl flex items-center justify-center text-blue-300 font-black text-sm relative transition shadow-md active:scale-95 cursor-pointer"
              title="Chiêu 2 [2]"
            >
              {player.skillCooldowns?.skill2 > 0 ? (
                <span className="text-amber-400 font-mono font-extrabold text-base">
                  {Math.ceil(player.skillCooldowns.skill2)}
                </span>
              ) : (
                <Shield className="w-5 h-5 text-blue-400" />
              )}
            </button>
            <span className="text-[10px] text-slate-400 mt-1 font-mono font-bold">[2] Chiêu 2</span>
          </div>

          {/* Skill 3 [3] Ultimate */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => triggerSkill(3)}
              className="w-12 h-12 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/60 rounded-xl flex items-center justify-center text-amber-300 font-black text-sm relative transition shadow-md active:scale-95 cursor-pointer"
              title="Nộ Long Tuyệt Kỹ [3]"
            >
              {player.skillCooldowns?.skill3 > 0 ? (
                <span className="text-amber-400 font-mono font-extrabold text-base">
                  {Math.ceil(player.skillCooldowns.skill3)}
                </span>
              ) : (
                <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
              )}
            </button>
            <span className="text-[10px] text-amber-400 mt-1 font-mono font-bold">[3] Nộ Tuyệt</span>
          </div>
        </div>
      </div>

    </div>
  );
});

export default HUD;
