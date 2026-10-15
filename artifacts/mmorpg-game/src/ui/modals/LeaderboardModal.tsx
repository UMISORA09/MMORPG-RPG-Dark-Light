import { memo, useMemo } from "react";
import { useGetLeaderboard, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { useGameStore } from "@/stores";
import { X, Trophy, Sparkles, Sword, Shield, Crown, Medal } from "lucide-react";

export const LeaderboardModal = memo(function LeaderboardModal() {
  const activeModal = useGameWorldStore((s) => s.activeModal);
  const legacyModal = useGameStore((s) => s.game.activeModal);
  const isOpen = activeModal === "leaderboard" || legacyModal === "leaderboard";

  const close = () => {
    useGameWorldStore.getState().closeActiveModal();
    useGameStore.getState().closeActiveModal();
  };

  const { data: rawLeaderboard = [], isLoading: leaderboardLoading } = useGetLeaderboard({
    query: {
      queryKey: getGetLeaderboardQueryKey(),
      enabled: isOpen,
    },
  });

  const leaderboard = useMemo(
    () => (Array.isArray(rawLeaderboard) ? rawLeaderboard : []),
    [rawLeaderboard]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none font-sans animate-in fade-in duration-200 pointer-events-auto"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[88vh] flex flex-col bg-[#0b0616]/95 border-2 border-purple-500/40 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.95)] overflow-hidden text-slate-100 ring-1 ring-purple-400/20"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-amber-950/30 to-slate-950/60">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-purple-500 to-indigo-600 flex items-center justify-center text-slate-950 shadow-lg shadow-purple-500/30">
              <Trophy className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wider text-purple-200 uppercase flex items-center gap-2">
                Bảng Vinh Danh Long Tộc
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                  ĐẠI LỤC CHIẾN LONG
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Top những dũng sĩ kiệt xuất nhất đạt cấp độ và chiến tích cao nhất
              </p>
            </div>
          </div>

          <button
            onClick={close}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-red-500/20 hover:text-red-300 text-slate-400 border border-slate-700/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-2.5">
          {leaderboardLoading ? (
            <div className="text-center py-16 text-slate-400 flex flex-col items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400 animate-spin" />
              <span>Đang tra cứu biên niên sử vinh danh...</span>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-16 text-slate-500">Chưa có dữ liệu chiến binh ghi danh</div>
          ) : (
            leaderboard.map((hero: any, index: number) => {
              const isTop1 = index === 0;
              const isTop2 = index === 1;
              const isTop3 = index === 2;

              return (
                <div
                  key={`${hero.characterName}-${index}`}
                  className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 ${
                    isTop1
                      ? "bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-900/80 border-amber-500/60 shadow-[0_0_24px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/30"
                      : isTop2
                      ? "bg-slate-900/80 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                      : isTop3
                      ? "bg-slate-900/70 border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.12)]"
                      : "bg-slate-900/50 border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Rank Badge */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-md shrink-0 ${
                        isTop1
                          ? "bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 shadow-amber-500/40 ring-2 ring-amber-300"
                          : isTop2
                          ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950 shadow-cyan-500/30"
                          : isTop3
                          ? "bg-gradient-to-br from-purple-400 to-indigo-600 text-white shadow-purple-500/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {isTop1 ? (
                        <Crown className="w-5 h-5 text-slate-950" />
                      ) : isTop2 || isTop3 ? (
                        <Medal className="w-5 h-5" />
                      ) : (
                        `#${index + 1}`
                      )}
                    </div>

                    {/* Hero Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black text-sm sm:text-base flex items-center gap-1.5 ${
                            isTop1 ? "text-amber-300" : isTop2 ? "text-cyan-300" : "text-white"
                          }`}
                        >
                          {hero.characterName}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                          {hero.characterClass || "Chiến Binh"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1 font-mono text-cyan-400">
                          <Sword className="w-3.5 h-3.5" /> Level {hero.level || 1}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-amber-400">
                          <Sparkles className="w-3.5 h-3.5" /> {(hero.experience || 0).toLocaleString("vi-VN")} EXP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side stats badge */}
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-amber-300 flex items-center justify-end gap-1">
                      {(hero.gold || 0).toLocaleString("vi-VN")} 🪙
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Ngân Lượng
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
});

export default LeaderboardModal;
