import { memo, useEffect, useState } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { Skull, ShieldAlert, Sparkles, Home } from "lucide-react";

export const PlayerDeathRespawnModal = memo(function PlayerDeathRespawnModal() {
  const isDead = useGameWorldStore((s) => s.isDead);
  const respawnCountdown = useGameWorldStore((s) => s.respawnCountdown);
  const respawnAtTown = useGameWorldStore((s) => s.respawnAtTown);
  const playerExp = useGameWorldStore((s) => s.playerExp);
  const playerGold = useGameWorldStore((s) => s.playerGold);

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-red-950/70 backdrop-blur-md select-none animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-[#0a0d14] border-2 border-red-600/70 rounded-3xl p-6 md:p-8 overflow-hidden shadow-[0_0_80px_rgba(220,38,38,0.5)] flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        {/* Blood vignette ambient glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-600/20 blur-3xl rounded-full pointer-events-none" />

        {/* Skull Icon with pulsating glow */}
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full bg-red-950/80 border-2 border-red-500/60 flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse">
            <Skull className="w-10 h-10 text-red-400" />
          </div>
          <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-red-600 text-[10px] font-black text-white uppercase tracking-wider">
            TỬ TRẬN
          </span>
        </div>

        {/* Title */}
        <h2 className="text-xl md:text-2xl font-black text-white tracking-wider flex items-center justify-center gap-2 drop-shadow-[0_2px_10px_rgba(239,68,68,0.8)]">
          💀 BẠN ĐÃ GỤC NGÃ TRÊN CHIẾN TRƯỜNG
        </h2>

        <p className="text-xs md:text-sm text-slate-300 mt-2 max-w-md leading-relaxed">
          Sức mạnh của quái vật đã hạ gục bạn. Linh hồn của bạn sẽ được bảo vệ và dịch chuyển bắt buộc về{" "}
          <strong className="text-amber-300 font-bold">Quảng Trường Làng Tân Thủ (Safe Zone)</strong> để hồi phục 100% sinh lực.
        </p>

        {/* Penalty Card */}
        <div className="w-full my-5 p-3.5 rounded-2xl bg-slate-900/90 border border-red-500/30 flex flex-col gap-2 text-left">
          <div className="flex items-center gap-2 text-xs font-bold text-red-300">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>Hình Phạt Tử Trận (Hardcore Rules):</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Kinh nghiệm:</span>
              <span className="text-red-400 font-bold">-5% (-{expLoss})</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Vàng túi:</span>
              <span className="text-amber-400 font-bold">-2% (-{goldLoss})</span>
            </div>
          </div>
          <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Toàn bộ hiệu ứng xấu (Choáng, Làm Chậm, Chảy Máu) sẽ được thanh tẩy hoàn toàn.</span>
          </p>
        </div>

        {/* Countdown & Action Button */}
        <div className="w-full space-y-3">
          <button
            onClick={() => respawnAtTown()}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,242,255,0.4)] active:scale-98 transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>[🏛️ Hồi Sinh Về Làng Tân Thủ Ngay]</span>
          </button>

          <div className="text-xs text-slate-400 font-mono">
            Tự động dịch chuyển sau:{" "}
            <span className="text-cyan-400 font-black text-sm">
              {Math.max(0, Math.ceil(respawnCountdown > 0 ? respawnCountdown : localSeconds))}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
