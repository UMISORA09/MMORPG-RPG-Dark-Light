// ==============================================================================
// LoadingTransitionScreen — Màn Hình Tải Trận & Chuyển Vùng 2.5D
// Dark Fantasy Cinema Teal, Dragon Sigil & Smooth Progress Bar
// Displays during zone changes, dungeon entry & fast travel
// ==============================================================================

import { memo } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { Compass, Sparkles, Lightbulb } from "lucide-react";

export const LoadingTransitionScreen = memo(function LoadingTransitionScreen() {
  const isTransitionLoading = useGameWorldStore((s) => s.isTransitionLoading);
  const transitionTargetZone = useGameWorldStore((s) => s.transitionTargetZone);
  const transitionProgress = useGameWorldStore((s) => s.transitionProgress);
  const transitionTip = useGameWorldStore((s) => s.transitionTip);

  if (!isTransitionLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-12 bg-black/90 backdrop-blur-xl select-none font-sans animate-in fade-in duration-200">
      
      {/* ── Top Header / Logo ── */}
      <div className="flex flex-col items-center text-center mt-6">
        <span className="text-[11px] font-black tracking-[0.3em] uppercase text-cyan-400 font-mono flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
          <span>CHIẾN LONG BÁ • THẾ GIỚI 2.5D MMORPG</span>
          <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-widest uppercase mt-1">
          Chuyển Tiếp Vùng Đất
        </h1>
      </div>

      {/* ── Center: Colossal Dragon Rune & Target Zone ── */}
      <div className="flex flex-col items-center justify-center text-center my-auto">
        {/* Animated Dragon Sigil */}
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
          {/* Outer rotating arcane ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/40 animate-spin [animation-duration:12s]" />
          
          {/* Middle counter-rotating ring */}
          <div className="absolute inset-2 rounded-full border border-amber-500/50 animate-spin [animation-duration:8s] [animation-direction:reverse]" />
          
          {/* Inner glowing pulse core */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-amber-500/30 border border-cyan-400/60 shadow-[0_0_35px_rgba(6,182,212,0.5)] flex items-center justify-center animate-pulse">
            <span className="text-4xl">🐉</span>
          </div>
        </div>

        {/* Destination Nameplate */}
        <div className="mt-6 flex flex-col items-center">
          <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-amber-400 animate-spin [animation-duration:6s]" />
            <span>Điểm đến tiếp theo:</span>
          </span>
          <h2 className="text-xl sm:text-3xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 mt-1 uppercase drop-shadow-[0_2px_15px_rgba(251,191,36,0.4)]">
            {transitionTargetZone || "ĐẠI LỤC LONG TỘC"}
          </h2>
        </div>

        {/* Smooth Loading Progress Bar */}
        <div className="w-64 sm:w-96 mt-6 flex flex-col items-center gap-2">
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/80 p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-amber-400 rounded-full transition-all duration-150 ease-out shadow-[0_0_15px_#00f2ff]"
              style={{ width: `${transitionProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between w-full text-[11px] font-mono text-slate-400">
            <span>Đang nạp dữ liệu địa hình 3D...</span>
            <span className="font-black text-cyan-300">{Math.round(transitionProgress)}%</span>
          </div>
        </div>
      </div>

      {/* ── Bottom: Gameplay Tip Card ── */}
      <div className="w-full max-w-xl mb-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 shrink-0">
          <Lightbulb className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[11px] font-mono font-black uppercase text-amber-400 tracking-wider">
            Mẹo Hữu Ích Đại Lục
          </h4>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            {transitionTip || "Kích hoạt chuỗi combo 3 đòn liên tiếp để tối ưu hóa sát thương và làm choáng quái vật."}
          </p>
        </div>
      </div>

    </div>
  );
});

export default LoadingTransitionScreen;

