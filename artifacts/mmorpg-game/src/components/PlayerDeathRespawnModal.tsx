import { memo, useEffect, useState } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { Skull, ShieldAlert, Sparkles, Home, Flame, Zap, Clock, Coins, Swords } from "lucide-react";

export const PlayerDeathRespawnModal = memo(function PlayerDeathRespawnModal() {
  const isDead = useGameWorldStore((s) => s.isDead);
  const respawnCountdown = useGameWorldStore((s) => s.respawnCountdown);
  const respawnAtTown = useGameWorldStore((s) => s.respawnAtTown);
  const playerExp = useGameWorldStore((s) => s.playerExp);
  const playerGold = useGameWorldStore((s) => s.playerGold);
  const playerLevel = useGameWorldStore((s) => s.playerLevel);
  const battleReport = useGameWorldStore((s) => s.battleReport);

  const [localSeconds, setLocalSeconds] = useState(3);

  useEffect(() => {
    if (!isDead) {
      setLocalSeconds(3);
      return;
    }

    const timer = setInterval(() => {
      setLocalSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          respawnAtTown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isDead, respawnAtTown]);

  if (!isDead) return null;

  const expLoss = Math.floor(playerExp * 0.05);
  const goldLoss = Math.floor(playerGold * 0.02);

  const monsterName = battleReport?.monsterName || "Quái Vật Đại Lục / Boss";
  const monsterLevel = battleReport?.monsterLevel || playerLevel || 1;
  const durationSeconds = battleReport?.durationSeconds ?? 3;
  const totalDamageDealt = battleReport?.totalDamageDealt ?? 0;
  const critHits = battleReport?.critHits ?? 0;
  const currentCountdown = Math.max(0, Math.ceil(respawnCountdown > 0 ? respawnCountdown : localSeconds));

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#11141c]/95 border border-red-500/50 rounded-[28px] p-5 sm:p-7 overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.85),0_0_60px_rgba(239,68,68,0.25)] flex flex-col gap-4 text-center animate-in zoom-in-95 duration-200 my-auto">
        {/* Subtle Ambient Red Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-red-600/15 blur-3xl rounded-full pointer-events-none" />

        {/* ── 1. HEADER: SKULL BADGE & TITLE ── */}
        <div className="flex flex-col items-center">
          <div className="relative mb-2.5">
            <div className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-500/60 flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] animate-pulse">
              <Skull className="w-8 h-8 text-red-400" />
            </div>
            <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-red-600 text-[10px] font-black text-white uppercase tracking-wider shadow-sm">
              TỬ TRẬN
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase flex items-center justify-center gap-2 drop-shadow-[0_2px_8px_rgba(239,68,68,0.8)]">
            💀 Bạn Đã Gục Ngã Trên Chiến Trường
          </h2>

          <p className="text-xs text-slate-300 mt-1 max-w-md leading-relaxed">
            Sức mạnh của quái vật đã hạ gục bạn. Linh hồn sẽ được bảo vệ và dịch chuyển về{" "}
            <strong className="text-amber-300 font-bold">Quảng Trường Làng Tân Thủ</strong> để hồi phục 100% sinh lực.
          </p>
        </div>

        {/* ── 2. DEFEAT OPPONENT BANNER ── */}
        <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-red-900/50 border border-red-500/40 flex items-center justify-center shrink-0">
            <Swords className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Tử Trận Tại Đại Lục</div>
            <div className="text-sm font-bold text-white truncate">{monsterName}</div>
            <div className="text-[11px] text-slate-400">
              Mục tiêu Cấp {monsterLevel} • Thời gian chiến đấu: {durationSeconds}s
            </div>
          </div>
        </div>

        {/* ── 3. BATTLE STATS 4-GRID ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left font-sans">
          <div className="p-2.5 rounded-xl bg-[#181d2a] border border-[#273044] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Sát Thương</span>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-sm font-black text-white mt-1">{totalDamageDealt.toLocaleString()}</div>
            <div className="text-[9px] text-slate-500 mt-0.5">DPS Hiệu Quả</div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#181d2a] border border-[#273044] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Chí Mạng</span>
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <div className="text-sm font-black text-amber-300 mt-1">{critHits} lần</div>
            <div className="text-[9px] text-slate-500 mt-0.5">Bạo kích 1.8x</div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#181d2a] border border-[#273044] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Thời Gian</span>
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-sm font-black text-cyan-300 mt-1">{durationSeconds}s</div>
            <div className="text-[9px] text-slate-500 mt-0.5">Thời lượng</div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#181d2a] border border-[#273044] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Phần Thưởng</span>
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-sm font-black text-emerald-400 mt-1">+0 Vàng</div>
            <div className="text-[9px] text-slate-500 mt-0.5">+0 EXP</div>
          </div>
        </div>

        {/* ── 4. PENALTY CARD (HARDCORE RULES) ── */}
        <div className="p-3 rounded-2xl bg-[#181d2a]/90 border border-red-500/30 flex flex-col gap-2 text-left">
          <div className="flex items-center gap-2 text-xs font-bold text-red-300">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>Hình Phạt Tử Trận (Hardcore Rules):</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Kinh nghiệm:</span>
              <span className="text-red-400 font-bold">-5% (-{expLoss})</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Vàng túi:</span>
              <span className="text-amber-400 font-bold">-2% (-{goldLoss})</span>
            </div>
          </div>
          <p className="text-[10px] text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Toàn bộ hiệu ứng xấu (Choáng, Làm Chậm, Chảy Máu) sẽ được thanh tẩy hoàn toàn.</span>
          </p>
        </div>

        {/* ── 5. ACTION & COUNTDOWN ── */}
        <div className="space-y-2 mt-1">
          <button
            onClick={() => respawnAtTown()}
            className="w-full py-3.5 px-6 rounded-full bg-[#28c3e1] hover:brightness-110 text-[#1c161a] font-black text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(40,195,225,0.45)] transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>[🏛️ Hồi Sinh Về Làng Tân Thủ Ngay]</span>
          </button>

          <div className="text-xs text-slate-400 font-mono">
            Tự động dịch chuyển sau:{" "}
            <span className="text-cyan-400 font-black text-sm">
              {currentCountdown}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
