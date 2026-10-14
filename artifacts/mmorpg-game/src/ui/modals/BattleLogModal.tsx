import { memo } from "react";
import { useGetBattleLog, getGetBattleLogQueryKey } from "@workspace/api-client-react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { useGameStore } from "@/stores";
import { X, ScrollText, Clock } from "lucide-react";

export interface BattleLogModalProps {
  characterId?: number;
}

export const BattleLogModal = memo(function BattleLogModal({ characterId }: BattleLogModalProps) {
  const worldModal = useGameWorldStore((s) => s.activeModal);
  const legacyModal = useGameStore((s) => s.game.activeModal);
  const isOpen = (worldModal as string) === "battleLog" || (legacyModal as string) === "battle_logs";

  const close = () => {
    useGameWorldStore.getState().closeActiveModal();
    useGameStore.getState().closeActiveModal();
  };

  const selectedCharId =
    characterId ||
    (typeof window !== "undefined"
      ? Number(localStorage.getItem("selectedCharacterId")) || 1
      : 1);

  const { data: rawLogs = [], isLoading: logLoading } = useGetBattleLog(
    selectedCharId,
    {
      query: {
        queryKey: getGetBattleLogQueryKey(selectedCharId),
        enabled: isOpen && !!selectedCharId,
      },
    }
  );

  const logs = Array.isArray(rawLogs) ? rawLogs : [];

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
            <ScrollText className="w-6 h-6 text-red-400" />
            <div>
              <h2 className="text-lg font-black tracking-wide text-white uppercase flex items-center gap-2">
                Lịch Sử Chiến Báo
              </h2>
              <p className="text-xs text-slate-400">
                Ghi nhận các chiến tích tiêu diệt quái vật và Boss rồng
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
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-2.5">
          {logLoading ? (
            <div className="text-center py-12 text-slate-400">Đang tải chiến báo...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Chưa có bản ghi chiến báo nào</div>
          ) : (
            logs.map((log: any, idx: number) => {
              const isWin = log.result === "VICTORY" || log.result === "win";

              return (
                <div
                  key={log.id || `log-${idx}`}
                  className={`p-3.5 rounded-2xl border ${
                    isWin
                      ? "bg-emerald-950/20 border-emerald-500/30"
                      : "bg-red-950/20 border-red-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-full border ${
                        isWin
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                          : "bg-red-500/20 text-red-300 border-red-400/30"
                      }`}
                    >
                      {isWin ? "🏆 CHIẾN THẮNG" : "💀 THẤT BẠI"}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : "Vừa xong"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 mt-1">{log.details || log.message || "Giao tranh ác liệt"}</p>

                  {(log.expGained || log.goldGained) && (
                    <div className="flex items-center gap-3 mt-2 text-xs font-mono">
                      {log.expGained && <span className="text-cyan-400">+{log.expGained} EXP</span>}
                      {log.goldGained && <span className="text-amber-400">+{log.goldGained} Vàng</span>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
});

export default BattleLogModal;
