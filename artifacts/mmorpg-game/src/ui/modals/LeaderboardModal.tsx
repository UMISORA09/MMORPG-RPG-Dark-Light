import { memo } from "react";
import { useGetLeaderboard, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { useGameStore } from "@/stores";
import { X, Trophy, Sparkles, Sword } from "lucide-react";

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

  const leaderboard = Array.isArray(rawLeaderboard) ? rawLeaderboard : [];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md select-none font-sans animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-slate-950/95 border border-slate-700/80 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-lg font-black tracking-wide text-white uppercase flex items-center gap-2">
                Bảng Vinh Danh Long Tộc
              </h2>
              <p className="text-xs text-slate-400">
                Top những chiến binh mạnh nhất đại lục Long Tộc
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="p-1.5 rounded-full bg-slate-800/80 hover:bg-red-500/20 hover:text-red-300 text-slate-400 border border-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-2">
          {leaderboardLoading ? (
            <div className="text-center py-12 text-slate-400">Đang tải bảng xếp hạng...</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Chưa có dữ liệu vinh danh</div>
          ) : (
            leaderboard.map((hero: any, index: number) => {
              const isTop1 = index === 0;
              const isTop2 = index === 1;
              const isTop3 = index === 2;

              return (
                <div
                  key={`${hero.characterName}-${index}`}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                    isTop1
                      ? "bg-amber-950/30 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                      : isTop2
                      ? "bg-slate-800/40 border-slate-500/40"
                      : isTop3
                      ? "bg-orange-950/20 border-orange-500/30"
                      : "bg-slate-900/60 border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-inner ${
                        isTop1
                          ? "bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 shadow-amber-500/50"
                          : isTop2
                          ? "bg-slate-300 text-slate-900"
                          : isTop3
                          ? "bg-amber-700 text-white"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white flex items-center gap-1">
                          {hero.characterName}
                          {isTop1 && <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          Lv.{hero.level} {hero.className}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        Chủ nhân: {hero.username}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-cyan-400 font-mono flex items-center justify-end gap-1">
                      <Sword className="w-3 h-3" /> {hero.kills} Quái
                    </div>
                    <div className="text-[11px] text-amber-400 font-mono">
                      {hero.gold} 🪙
                    </div>
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
